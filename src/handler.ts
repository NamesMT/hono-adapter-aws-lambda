import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import type { ReadableStreamDefaultReader } from 'node:stream/web'
import type { Env, Hono, Schema } from 'hono'
import { encodeBase64 } from 'hono/utils/encode'

import type {
  ALBRequestContext,
  ApiGatewayRequestContext,
  ApiGatewayRequestContextV2,
} from './custom-context'
import type { LambdaContext } from './types'

// @ts-expect-error CryptoKey missing
globalThis.crypto ??= crypto

export type LambdaEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2 | ALBProxyEvent | LambdaTriggerEvent
export type LambdaRequestEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2 | ALBProxyEvent

// When calling HTTP API or Lambda directly through function urls
export interface APIGatewayProxyEventV2 {
  version: string
  routeKey: string
  headers: Record<string, string | undefined>
  cookies?: string[]
  rawPath: string
  rawQueryString: string
  body?: string | null
  isBase64Encoded: boolean
  requestContext: ApiGatewayRequestContextV2
  queryStringParameters?: {
    [name: string]: string | undefined
  }
  pathParameters?: {
    [name: string]: string | undefined
  }
  stageVariables?: {
    [name: string]: string | undefined
  }
}

// When calling Lambda through an API Gateway
export interface APIGatewayProxyEvent {
  version: string
  httpMethod: string
  headers: Record<string, string | undefined>
  multiValueHeaders?: {
    [headerKey: string]: string[]
  }
  path: string
  body: string | null
  isBase64Encoded: boolean
  queryStringParameters?: Record<string, string | undefined>
  requestContext: ApiGatewayRequestContext
  resource: string
  multiValueQueryStringParameters?: {
    [parameterKey: string]: string[]
  }
  pathParameters?: Record<string, string>
  stageVariables?: Record<string, string>
}

// When calling Lambda through an Application Load Balancer
export interface ALBProxyEvent {
  httpMethod: string
  headers: Record<string, string | undefined>
  path: string
  body: string | null
  isBase64Encoded: boolean
  queryStringParameters?: Record<string, string | undefined>
  requestContext: ALBRequestContext
}

// When calling Lambda through triggers, i.e: S3, SES, SQS.
// Ref: https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html
export type LambdaTriggerEvent = CommonRecordsTriggerEvent | eventSourceTriggerEvent | sourceTriggerEvent

/**
 * "Records.eventSource", A commonly-seen common trigger event schema, which is nested under Records
 * 
 * Used by S3, SES, SQS, DynamoDB
 */
export interface CommonRecordsTriggerEvent {
  Records: Array<{
    eventSource: string
    eventSourceARN?: string
    eventVersion?: string
    eventTime?: string
    eventName?: string
    awsRegion?: string
    [key: string]: any
  }>
}

/**
 * "eventSource" trigger event schema
 * 
 * Used by DocumentDB, Kafka, MQ
 */
export interface eventSourceTriggerEvent {
  eventSource: string
  eventSourceARN?: string
  [key: string]: any
}

/**
 * "source" trigger event schema
 * 
 * Used by EC2, EventBridge
 */
export interface sourceTriggerEvent {
  source: string
  [key: string]: any
}

export interface APIGatewayProxyResult {
  statusCode: number
  statusDescription?: string
  body: string
  headers: Record<string, string>
  cookies?: string[]
  multiValueHeaders?: {
    [headerKey: string]: string[]
  }
  isBase64Encoded: boolean
}

async function streamToNodeStream(reader: ReadableStreamDefaultReader<Uint8Array>, writer: NodeJS.WritableStream) {
  let readResult = await reader.read()
  while (!readResult.done) {
    writer.write(readResult.value)
    readResult = await reader.read()
  }
  writer.end()
}

export function streamHandle<
  E extends Env = Env,
  S extends Schema = {},
  BasePath extends string = '/',
>(app: Hono<E, S, BasePath>) {
  return awslambda.streamifyResponse(
    async (event: LambdaEvent, responseStream: NodeJS.WritableStream, context: LambdaContext) => {
      try {
        const req = createRequest(event)

        const res = await app.fetch(req, {
          event,
          context,
        })

        // Check content type
        const httpResponseMetadata = {
          statusCode: res.status,
          headers: Object.fromEntries(res.headers.entries()),
        }

        if (res.body) {
          await streamToNodeStream(
            res.body.getReader(),
            awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata),
          )
        }
      }
      catch (error) {
        console.error('Error processing request:', error)
        responseStream.write('Internal Server Error')
      }
      finally {
        responseStream.end()
      }
    },
  )
}

/**
 * Accepts events from API Gateway/ELB(`APIGatewayProxyEvent`) and directly through Function Url(`APIGatewayProxyEventV2`)
 */
export function handle<E extends Env = Env, S extends Schema = {}, BasePath extends string = '/'>(app: Hono<E, S, BasePath>) {
  return async (
    event: LambdaEvent,
    lambdaContext?: LambdaContext,
  ): Promise<APIGatewayProxyResult> => {
    const req = createRequest(event)

    const res = await app.fetch(req, {
      event,
      lambdaContext,
    })

    return createResult(event, res)
  }
}

async function createResult(event: LambdaEvent, res: Response): Promise<APIGatewayProxyResult> {
  const contentType = res.headers.get('content-type')
  let isBase64Encoded = !!(contentType && isContentTypeBinary(contentType))

  if (!isBase64Encoded) {
    const contentEncoding = res.headers.get('content-encoding')
    isBase64Encoded = isContentEncodingBinary(contentEncoding)
  }

  const body = isBase64Encoded ? encodeBase64(await res.arrayBuffer()) : await res.text()

  const result: APIGatewayProxyResult = {
    body,
    headers: {},
    statusCode: res.status,
    isBase64Encoded,
  }

  setCookies(event, res, result)
  res.headers.forEach((value, key) => {
    result.headers[key] = value
  })

  return result
}

function createRequest(event: LambdaEvent) {
  if (isTriggerEvent(event)) {
    const requestInit: RequestInit = {
      method: 'TRIGGER',
    }

    // adding '/' before eventSource because hono enforce prefix all paths starting with a '/', ref: https://github.com/honojs/hono/blob/main/src/utils/url.ts#L91
    return new Request(`http://localhost/${getEventSource(event)}`, requestInit)
  }
  else {
    const queryString = extractQueryString(event)
    const domainName
      = event.requestContext && 'domainName' in event.requestContext
        ? event.requestContext.domainName
        : event.headers.host
    const path = isProxyEventV2(event) ? event.rawPath : event.path
    const urlPath = `https://${domainName}${path}`
    const url = queryString ? `${urlPath}?${queryString}` : urlPath

    const headers = new Headers()
    getCookies(event, headers)
    for (const [k, v] of Object.entries(event.headers)) {
      if (v)
        headers.set(k, v)
    }

    const method = isProxyEventV2(event) ? event.requestContext.http.method : event.httpMethod
    const requestInit: RequestInit = {
      headers,
      method,
    }

    if (event.body)
      requestInit.body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body

    return new Request(url, requestInit)
  }
}

function extractQueryString(event: LambdaRequestEvent) {
  return isProxyEventV2(event)
    ? event.rawQueryString
    : Object.entries(event.queryStringParameters || {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
}

function getCookies(event: LambdaEvent, headers: Headers) {
  if (isProxyEventV2(event) && Array.isArray(event.cookies))
    headers.set('Cookie', event.cookies.join('; '))
}

function setCookies(event: LambdaEvent, res: Response, result: APIGatewayProxyResult) {
  if (res.headers.has('set-cookie')) {
    const cookies = res.headers.get('set-cookie')?.split(', ')
    if (Array.isArray(cookies)) {
      if (isProxyEventV2(event)) {
        result.cookies = cookies
      }
      else {
        result.multiValueHeaders = {
          'set-cookie': cookies,
        }
      }
      res.headers.delete('set-cookie')
    }
  }
}

function isProxyEventV2(event: LambdaEvent): event is APIGatewayProxyEventV2 {
  return Object.prototype.hasOwnProperty.call(event, 'rawPath')
}

function isTriggerEvent(event: LambdaEvent): event is LambdaTriggerEvent {
  try {
    return Boolean(getEventSource(event as LambdaTriggerEvent))
  }
  catch {
    return false
  }
}

export function getEventSource(event: LambdaTriggerEvent): string {
  const eventSource = (
    (event as CommonRecordsTriggerEvent)?.Records?.[0]?.eventSource
    || (event as eventSourceTriggerEvent)?.eventSource
    || (event as sourceTriggerEvent)?.source
  )

  if (!eventSource)
    throw new Error('Invalid `event`: not LambdaTriggerEvent')

  return eventSource
}

export function isContentTypeBinary(contentType: string) {
  return !/^(text\/(plain|html|css|javascript|csv).*|application\/(.*json|.*xml).*|image\/svg\+xml.*)$/.test(
    contentType,
  )
}

export function isContentEncodingBinary(contentEncoding: string | null) {
  if (contentEncoding === null)
    return false

  return /^(gzip|deflate|compress|br)/.test(contentEncoding)
}
