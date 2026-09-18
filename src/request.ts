import type { LambdaRequestEvent } from '@namesmt/utils-lambda'
import type { ALBEvent, APIGatewayProxyEvent, APIGatewayProxyEventV2, APIGatewayProxyResult, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import type { EventProcessor, ResultOptions } from './common'

import type { AdapterEvent, LambdaHandlerResult, LatticeProxyEventV2 } from './types'
import { decodeBase64, encodeBase64 } from 'hono/utils/encode'
import { defaultIsContentTypeBinary, isContentEncodingBinary } from './common'

// eslint-disable-next-line no-control-regex
const NON_ASCII_REGEX = /[^\x00-\x7F]/

function sanitizeHeaderValue(value: string): string {
  // Check if the value contains non-ASCII characters (char codes > 127)
  if (!NON_ASCII_REGEX.test(value))
    return value
  return encodeURIComponent(value)
}

abstract class RequestEventProcessor<E extends LambdaRequestEvent | LatticeProxyEventV2> implements EventProcessor<E> {
  protected abstract getPath(event: E): string

  protected abstract getMethod(event: E): string

  protected abstract getQueryString(event: E): string

  protected abstract getHeaders(event: E): Headers

  protected abstract getCookies(event: E, headers: Headers): void

  protected abstract setCookiesToResult(
    event: E,
    result: LambdaHandlerResult,
    cookies: string[]
  ): void

  createRequest(event: E): Request {
    const queryString = this.getQueryString(event)
    const domainName
      = event.requestContext && 'domainName' in event.requestContext
        ? event.requestContext.domainName
        : (event as unknown as APIGatewayProxyEventV2).headers?.host ?? (event as unknown as APIGatewayProxyEvent).multiValueHeaders?.host?.[0]
    const path = this.getPath(event)
    const urlPath = `https://${domainName}${path}`
    const url = queryString ? `${urlPath}?${queryString}` : urlPath

    const headers = this.getHeaders(event)

    const method = this.getMethod(event)
    const requestInit: RequestInit = {
      headers,
      method,
    }

    if (event.body) {
      const body = event.isBase64Encoded ? decodeBase64(event.body) : new TextEncoder().encode(event.body)
      requestInit.body = body
      headers.set('content-length', body.length.toString())
    }

    return new Request(url, requestInit)
  }

  async createResult(event: E, res: Response, options?: ResultOptions): Promise<LambdaHandlerResult> {
    const contentType = res.headers.get('content-type')
    const isContentTypeBinaryFn = options?.isContentTypeBinary ?? defaultIsContentTypeBinary
    let isBase64Encoded = !!(contentType && isContentTypeBinaryFn(contentType))

    if (!isBase64Encoded) {
      const contentEncoding = res.headers.get('content-encoding')
      isBase64Encoded = isContentEncodingBinary(contentEncoding)
    }

    const body = isBase64Encoded ? encodeBase64(await res.arrayBuffer()) : await res.text()

    const result = {
      body,
      headers: {} as NonNullable<APIGatewayProxyStructuredResultV2['headers']>,
      multiValueHeaders: undefined as APIGatewayProxyResult['multiValueHeaders'],
      statusCode: res.status,
      isBase64Encoded,
    } satisfies APIGatewayProxyResult & APIGatewayProxyStructuredResultV2

    if ('multiValueHeaders' in event) {
      result.multiValueHeaders = {}
    }

    this.setCookies(event, res, result)
    res.headers.forEach((value, key) => {
      result.headers[key] = value
      if ('multiValueHeaders' in event) {
        result.multiValueHeaders![key] = [value]
      }
    })

    return result
  }

  setCookies(event: E, res: Response, result: LambdaHandlerResult) {
    if (res.headers.has('set-cookie')) {
      const cookies = res.headers.getSetCookie
        ? res.headers.getSetCookie()
        : Array.from(res.headers.entries()).filter(([k]) => k === 'set-cookie').map(([, v]) => v)

      if (Array.isArray(cookies)) {
        this.setCookiesToResult(event, result, cookies)
        res.headers.delete('set-cookie')
      }
    }
  }
}

class EventV2Processor extends RequestEventProcessor<APIGatewayProxyEventV2> {
  protected getPath(event: APIGatewayProxyEventV2): string {
    return event.rawPath
  }

  protected getMethod(event: APIGatewayProxyEventV2): string {
    return event.requestContext.http.method
  }

  protected getQueryString(event: APIGatewayProxyEventV2): string {
    return event.rawQueryString
  }

  protected getCookies(event: APIGatewayProxyEventV2, headers: Headers): void {
    if (Array.isArray(event.cookies)) {
      headers.set('Cookie', event.cookies.join('; '))
    }
  }

  protected setCookiesToResult(
    _: APIGatewayProxyEventV2,
    result: APIGatewayProxyStructuredResultV2,
    cookies: string[],
  ): void {
    result.cookies = cookies
  }

  protected getHeaders(event: APIGatewayProxyEventV2): Headers {
    const headers = new Headers()
    this.getCookies(event, headers)
    if (event.headers) {
      for (const [k, v] of Object.entries(event.headers)) {
        if (v) {
          headers.set(k, v)
        }
      }
    }
    return headers
  }
}

export const v2Processor: EventV2Processor = new EventV2Processor()

class EventV1Processor extends RequestEventProcessor<Exclude<LambdaRequestEvent, APIGatewayProxyEventV2>> {
  protected getPath(event: Exclude<LambdaRequestEvent, APIGatewayProxyEventV2>): string {
    return event.path
  }

  protected getMethod(event: Exclude<LambdaRequestEvent, APIGatewayProxyEventV2>): string {
    return event.httpMethod
  }

  protected getQueryString(event: Exclude<LambdaRequestEvent, APIGatewayProxyEventV2>): string {
    // API Gateway passes decoded values, so we need to re-encode them to preserve the original URL
    if ((event as APIGatewayProxyEvent).multiValueQueryStringParameters) {
      return Object.entries((event as APIGatewayProxyEvent).multiValueQueryStringParameters || {})
        .filter(([, value]) => value)
        .map(([key, values]) => values!.map(value => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&'))
        .join('&')
    }
    else {
      return Object.entries(event.queryStringParameters || {})
        .filter(([, value]) => value)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value || '')}`)
        .join('&')
    }
  }

  protected getCookies(
    // eslint-disable-next-line unused-imports/no-unused-vars
    event: Exclude<LambdaRequestEvent, APIGatewayProxyEventV2>,
    // eslint-disable-next-line unused-imports/no-unused-vars
    headers: Headers,
  ): void {
    // nop
  }

  protected getHeaders(event: APIGatewayProxyEvent): Headers {
    const headers = new Headers()
    this.getCookies(event, headers)
    if (event.multiValueHeaders) {
      for (const [k, values] of Object.entries(event.multiValueHeaders)) {
        if (values) {
          values.forEach(v => headers.append(k, sanitizeHeaderValue(v)))
        }
      }
    }
    if (event.headers) {
      for (const [k, v] of Object.entries(event.headers)) {
        if (v && !headers.has(k)) {
          headers.set(k, sanitizeHeaderValue(v))
        }
      }
    }
    return headers
  }

  protected setCookiesToResult(
    _: APIGatewayProxyEvent,
    result: APIGatewayProxyResult,
    cookies: string[],
  ): void {
    result.multiValueHeaders = {
      'set-cookie': cookies,
    }
  }
}

export const v1Processor: EventV1Processor = new EventV1Processor()

class ALBProcessor extends RequestEventProcessor<ALBEvent> {
  protected getHeaders(event: ALBEvent): Headers {
    const headers = new Headers()
    // if multiValueHeaders is present the ALB will use it instead of the headers field
    // https://docs.aws.amazon.com/elasticloadbalancing/latest/application/lambda-functions.html#multi-value-headers
    if (event.multiValueHeaders) {
      for (const [key, values] of Object.entries(event.multiValueHeaders)) {
        if (values && Array.isArray(values)) {
          // https://www.rfc-editor.org/rfc/rfc9110.html#name-common-rules-for-defining-f
          headers.set(key, sanitizeHeaderValue(values.join('; ')))
        }
      }
    }
    else {
      for (const [key, value] of Object.entries(event.headers ?? {})) {
        if (value) {
          headers.set(key, sanitizeHeaderValue(value))
        }
      }
    }
    return headers
  }

  protected getPath(event: ALBEvent): string {
    return event.path
  }

  protected getMethod(event: ALBEvent): string {
    return event.httpMethod
  }

  protected getQueryString(event: ALBEvent): string {
    // In the case of ALB Integration either queryStringParameters or multiValueQueryStringParameters can be present not both
    /* 
      In other cases like when using the serverless framework, the event object does contain both queryStringParameters and multiValueQueryStringParameters:
      Below is an example event object for this URL: /payment/b8c55e69?select=amount&select=currency
      {
        ...
        queryStringParameters: { select: 'currency' },
        multiValueQueryStringParameters: { select: [ 'amount', 'currency' ] },
      }
      The expected results is for select to be an array with two items. However the pre-fix code is only returning one item ('currency') in the array.
      A simple fix would be to invert the if statement and check the multiValueQueryStringParameters first.
    */
    if (event.multiValueQueryStringParameters) {
      return Object.entries(event.multiValueQueryStringParameters || {})
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}=${value?.join(`&${key}=`)}`)
        .join('&')
    }
    else {
      return Object.entries(event.queryStringParameters || {})
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
    }
  }

  protected getCookies(event: ALBEvent, headers: Headers): void {
    let cookie
    if (event.multiValueHeaders) {
      cookie = event.multiValueHeaders.cookie?.join('; ')
    }
    else {
      cookie = event.headers ? event.headers.cookie : undefined
    }
    if (cookie) {
      headers.append('Cookie', cookie)
    }
  }

  protected setCookiesToResult(
    event: ALBEvent,
    result: APIGatewayProxyResult,
    cookies: string[],
  ): void {
    // when multi value headers is enabled
    if (event.multiValueHeaders && result.multiValueHeaders) {
      result.multiValueHeaders['set-cookie'] = cookies
    }
    else {
      // otherwise serialize the set-cookie
      result.headers!['set-cookie'] = cookies[0]
    }
  }
}

export const albProcessor: ALBProcessor = new ALBProcessor()

class LatticeV2Processor extends RequestEventProcessor<LatticeProxyEventV2> {
  protected getPath(event: LatticeProxyEventV2): string {
    return event.path
  }

  protected getMethod(event: LatticeProxyEventV2): string {
    return event.method
  }

  protected getQueryString(): string {
    return ''
  }

  protected getHeaders(event: LatticeProxyEventV2): Headers {
    const headers = new Headers()
    if (event.headers) {
      for (const [k, values] of Object.entries(event.headers)) {
        if (values) {
          values.forEach(v => headers.append(k, sanitizeHeaderValue(v)))
        }
      }
    }
    return headers
  }

  protected getCookies(): void {
    // nop
  }

  protected setCookiesToResult(
    _: LatticeProxyEventV2,
    result: APIGatewayProxyResult,
    cookies: string[],
  ): void {
    result.headers = {
      ...result.headers,
      'set-cookie': cookies[0],
    }
  }
}

export const latticeV2Processor: LatticeV2Processor = new LatticeV2Processor()

export function isProxyEventALB(event: AdapterEvent): event is ALBEvent {
  return Object.hasOwn(event, 'requestContext') && Object.hasOwn((event as LambdaRequestEvent).requestContext, 'elb')
}

export function isProxyEventV2(event: AdapterEvent): event is APIGatewayProxyEventV2 {
  // A V1 (REST API) event behind a custom domain base path mapping also carries a
  // `rawPath`, so `rawPath` alone is not enough to identify a V2 event. Every V2
  // (HTTP API / function URL) event has an `http` object on its request context.
  return Object.hasOwn(event, 'rawPath') && Object.hasOwn((event as LambdaRequestEvent).requestContext ?? {}, 'http')
}

export function isLatticeEventV2(event: AdapterEvent): event is LatticeProxyEventV2 {
  return Object.hasOwn(event, 'requestContext') && Object.hasOwn((event as LatticeProxyEventV2).requestContext ?? {}, 'serviceArn')
}
