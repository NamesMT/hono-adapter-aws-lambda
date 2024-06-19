import type { Env } from 'hono'
import { Hono } from 'hono'
import type { H } from 'hono/types'
import { mergePath } from 'hono/utils/url'
import { encodeBase64 } from 'hono/utils/encode'
import type { APIGatewayProxyResult, EventProcessor, LambdaEvent } from './handler'
import { isContentEncodingBinary, isContentTypeBinary } from './handler'

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

const METHOD = 'TRIGGER'

export class TriggerFactory<IE extends Env, HE extends Env> {
  private simpleRouter: Record<string, Record<string, true>> = {}

  honoApp: Hono<HE>
  internalApp = new Hono<IE>()

  constructor(app: Hono<HE>) {
    this.honoApp = app
  }

  on = (eventSource: string, id: string, ...handlers: H<IE>[]) => {
    let thisEventSource = this.simpleRouter[eventSource]
    if (!thisEventSource) {
      this.simpleRouter[eventSource] = thisEventSource = {}

      this.honoApp.on(METHOD, getTriggerPath(eventSource), async (c) => {
        // $!: rootTakeover, this is a special id that will return itself, bypass the execute of the rest of the ids
        if (thisEventSource['$!']) {
          return this.internalApp.fetch(makeLocalRequest(METHOD, `/${eventSource}/$!`))
        }

        const resObj: Record<string, any> = {}
        for (const route in thisEventSource) {
          // Bypass special ids in normal process loop
          if (route[0] === '$')
            continue

          const res = await this.internalApp.fetch(makeLocalRequest(METHOD, `/${eventSource}/${route}`))
          resObj[route] = /^application\/json/.test(res.headers.get('content-type') || '') ? await res.json() : await res.text()
        }

        // $: rootReturn, this is a special id that will always be processed last and return itself instead of an object of all ids result.
        if (thisEventSource['$=']) {
          return this.internalApp.fetch(makeLocalRequest(METHOD, `/${eventSource}/$=`))
        }

        return c.json(resObj)
      })
    }

    if (thisEventSource[id])
      throw new Error(`Route ID "${id}" already exists for event source "${eventSource}"`)

    this.internalApp.on(METHOD, `/${eventSource}/${id}`, ...handlers)
    thisEventSource[id] = true

    return this
  }
}

class TriggerEventProcessor implements EventProcessor<LambdaTriggerEvent> {
  createRequest(event: LambdaTriggerEvent): Request {
    const path = getTriggerPath(getEventSource(event))
    return makeLocalRequest(METHOD, path)
  }

  async createResult(event: LambdaTriggerEvent, res: Response): Promise<any> {
    const contentType = res.headers.get('content-type')
    let isBase64Encoded = !!(contentType && isContentTypeBinary(contentType))

    if (!isBase64Encoded) {
      const contentEncoding = res.headers.get('content-encoding')
      isBase64Encoded = isContentEncodingBinary(contentEncoding)
    }

    const body = isBase64Encoded ? encodeBase64(await res.arrayBuffer()) : await res.text()

    if (res.headers.get('return-body'))
      return body

    const result: APIGatewayProxyResult = {
      body,
      headers: {},
      statusCode: res.status,
      isBase64Encoded,
    }

    res.headers.forEach((value, key) => {
      result.headers[key] = value
    })

    return result
  }
}
export const triggerProcessor: TriggerEventProcessor = new TriggerEventProcessor()

// eslint-disable-next-line node/prefer-global/process
export const triggerPathUUID = `${process.env.SECRET_SALT}-${Date.now()}-${globalThis.crypto.randomUUID()}`

export function getTriggerPath(path: string) {
  return mergePath(triggerPathUUID, path)
}

type ExtractHonoEnv<A extends Hono> = A extends Hono<infer E> ? E : never

export function createTriggerFactory<E extends Env, A extends Hono<any, any, '/'>>(app: A) {
  return new TriggerFactory<E, ExtractHonoEnv<A>>(app)
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

export function isTriggerEvent(event: LambdaEvent): event is LambdaTriggerEvent {
  try {
    return Boolean(getEventSource(event as LambdaTriggerEvent))
  }
  catch {
    return false
  }
}

export function makeLocalRequest(method: string, path: string): Request {
  return new Request(`http://127.0.0.1${path}`, { method })
}