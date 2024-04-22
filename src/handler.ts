import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'
import type { ReadableStreamDefaultReader } from 'node:stream/web'
import type { Env, Hono, Schema } from 'hono'
import { encodeBase64 } from 'hono/utils/encode'
import { mergePath } from 'hono/utils/url'
import { SmartRouter } from 'hono/router/smart-router'
import { RegExpRouter } from 'hono/router/reg-exp-router'
import { LinearRouter } from 'hono/router/linear-router'
import { PatternRouter } from 'hono/router/pattern-router'
import type { LambdaContext } from './types'
import type {
  ALBRequestContext,
  ApiGatewayRequestContext,
  ApiGatewayRequestContextV2,
} from './custom-context'

// @ts-expect-error CryptoKey missing
globalThis.crypto ??= crypto

export type LambdaEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2 | ALBProxyEvent | LambdaTriggerEvent
export type LambdaRequestEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2 | ALBProxyEvent

// When calling HTTP API or Lambda directly through function urls
export interface APIGatewayProxyEventV2 {
  version: string
  routeKey: string
  headers: Record<string, string | undefined>
  multiValueHeaders?: undefined
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
  headers?: Record<string, string | undefined>
  multiValueHeaders?: Record<string, string[] | undefined>
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
      const processor = getProcessor(event)
      try {
        const req = processor.createRequest(event)

        const res = await app.fetch(req, {
          event,
          context,
        })

        // Check content type
        const httpResponseMetadata = {
          statusCode: res.status,
          headers: Object.fromEntries(res.headers.entries()),
        }

        // Update response stream
        responseStream = awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata)

        if (res.body)
          await streamToNodeStream(res.body.getReader(), responseStream)
        else
          responseStream.write('')
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
    const processor = getProcessor(event)

    const req = processor.createRequest(event)

    const res = await app.fetch(req, {
      event,
      lambdaContext,
    })

    return processor.createResult(event, res)
  }
}

abstract class EventProcessor<E extends LambdaEvent> {
  protected abstract getPath(event: E): string

  protected abstract getMethod(event: E): string

  protected abstract getQueryString(event: E): string

  protected abstract getCookies(event: E, headers: Headers): void

  protected abstract setCookiesToResult(result: APIGatewayProxyResult, cookies: string[]): void

  createRequest(event: E): Request {
    // createRequest will be overwritten and handled by triggerProcessor
    event = event as Exclude<E, LambdaTriggerEvent>

    const queryString = this.getQueryString(event)
    const domainName
      = event.requestContext && 'domainName' in event.requestContext
        ? event.requestContext.domainName
        : event.headers?.host ?? event.multiValueHeaders?.host?.[0]
    const path = this.getPath(event)
    const urlPath = `https://${domainName}${path}`
    const url = queryString ? `${urlPath}?${queryString}` : urlPath

    const headers = new Headers()
    this.getCookies(event, headers)
    if (event.headers) {
      for (const [k, v] of Object.entries(event.headers)) {
        if (v)
          headers.set(k, v)
      }
    }
    if (event.multiValueHeaders) {
      for (const [k, values] of Object.entries(event.multiValueHeaders)) {
        if (values)
          values.forEach(v => headers.append(k, v))
      }
    }

    const method = this.getMethod(event)
    const requestInit: RequestInit = {
      headers,
      method,
    }

    if (event.body)
      requestInit.body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body

    return new Request(url, requestInit)
  }

  async createResult(event: E, res: Response): Promise<APIGatewayProxyResult> {
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

    this.setCookies(event, res, result)
    res.headers.forEach((value, key) => {
      result.headers[key] = value
    })

    return result
  }

  setCookies = (event: LambdaEvent, res: Response, result: APIGatewayProxyResult) => {
    if (res.headers.has('set-cookie')) {
      const cookies = res.headers.get('set-cookie')?.split(', ')
      if (Array.isArray(cookies)) {
        this.setCookiesToResult(result, cookies)
        res.headers.delete('set-cookie')
      }
    }
  }
}

const triggerProcessor = new (class EventV2Processor extends EventProcessor<LambdaTriggerEvent> {
  protected getPath(_event: LambdaTriggerEvent): string {
    return ''
  }

  protected getMethod(_event: LambdaTriggerEvent): string {
    return ''
  }

  protected getQueryString(_event: LambdaTriggerEvent): string {
    return ''
  }

  protected getCookies(_event: LambdaTriggerEvent, _headers: Headers): void {
  }

  protected setCookiesToResult(result: APIGatewayProxyResult, cookies: string[]): void {
    result.cookies = cookies
  }

  createRequest(event: LambdaTriggerEvent): Request {
    const requestInit: RequestInit = {
      method: 'TRIGGER',
    }
    const path = getTriggerPath(getEventSource(event))
    return new Request(`http://127.0.0.1${path}`, requestInit)
  }
})()

const v2Processor = new (class EventV2Processor extends EventProcessor<APIGatewayProxyEventV2> {
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
    if (Array.isArray(event.cookies))
      headers.set('Cookie', event.cookies.join('; '))
  }

  protected setCookiesToResult(result: APIGatewayProxyResult, cookies: string[]): void {
    result.cookies = cookies
  }
})()

const v1Processor = new (class EventV1Processor extends EventProcessor<
  Exclude<LambdaEvent, APIGatewayProxyEventV2 | LambdaTriggerEvent>
> {
  protected getPath(event: Exclude<LambdaEvent, APIGatewayProxyEventV2 | LambdaTriggerEvent>): string {
    return event.path
  }

  protected getMethod(event: Exclude<LambdaEvent, APIGatewayProxyEventV2 | LambdaTriggerEvent>): string {
    return event.httpMethod
  }

  protected getQueryString(event: Exclude<LambdaEvent, APIGatewayProxyEventV2 | LambdaTriggerEvent>): string {
    return Object.entries(event.queryStringParameters || {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
  }

  protected getCookies(
    // eslint-disable-next-line unused-imports/no-unused-vars
    event: Exclude<LambdaEvent, APIGatewayProxyEventV2 | LambdaTriggerEvent>,
    // eslint-disable-next-line unused-imports/no-unused-vars
    headers: Headers,
  ): void {
    // nop
  }

  protected setCookiesToResult(result: APIGatewayProxyResult, cookies: string[]): void {
    result.multiValueHeaders = {
      'set-cookie': cookies,
    }
  }
})()

function getProcessor(event: LambdaEvent): EventProcessor<LambdaEvent> {
  if (isTriggerEvent(event))
    return triggerProcessor
  else if (isProxyEventV2(event))
    return v2Processor
  else
    return v1Processor
}

export const triggerPathUUID = globalThis.crypto.randomUUID()

export function getTriggerPath(path: string) {
  return mergePath(triggerPathUUID, path)
}

function fixTriggerPath(path: string) {
  const uuidIndex = path.indexOf(triggerPathUUID)
  return uuidIndex ? path.substring(uuidIndex - 1) : path
}

function fixTriggerRegExpPath(re: RegExp) {
  const s = re.source
  const uuidIndex = s.indexOf(triggerPathUUID)
  return uuidIndex ? new RegExp(`^\\/${s.substring(uuidIndex)}`) : re
}

export function fixTriggerRoutes(app: Hono) {
  app.routes.forEach(r => r.path = fixTriggerPath(r.path))

  const appRouter = app.router
  // For Array<[method, path, handler]>
  if (appRouter instanceof SmartRouter || appRouter instanceof LinearRouter) {
    appRouter.routes?.filter(r => r[0] === 'TRIGGER').forEach(r => r[1] = fixTriggerPath(r[1]))
  }
  // For Array<[path: RegExp, method, handler]>
  else if (appRouter instanceof PatternRouter) {
    // @ts-expect-error .routes is private
    appRouter.routes?.filter(r => r[1] === 'TRIGGER').forEach(r => r[0] = fixTriggerRegExpPath(r[0]))
  }
  // For Record<method, Record<path, handlers>>
  else if (appRouter instanceof RegExpRouter) {
    if (appRouter.routes?.TRIGGER) {
      for (const path of Object.keys(appRouter.routes.TRIGGER)) {
        if (path.includes(triggerPathUUID)) {
          appRouter.routes.TRIGGER[fixTriggerPath(path)] = appRouter.routes.TRIGGER[path]
          delete appRouter.routes.TRIGGER[path]
        }
      }
    }
  }
  else { throw new TypeError('Unsupported router') }
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
