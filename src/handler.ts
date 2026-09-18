import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import type { Env, Hono, Schema } from 'hono'
import type { ReadableStreamDefaultReader } from 'stream/web'
import type { ResultOptions } from './common'
import type { AdapterEvent, LambdaContext, LambdaHandler, LambdaHandlerResult } from './types'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { getProcessor } from './common'
import { minimalEvent } from './utils/event'

async function writableWriteReadable(writer: NodeJS.WritableStream, reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  let readResult = await reader.read()
  while (!readResult.done) {
    writer.write(readResult.value)
    readResult = await reader.read()
  }
  writer.end()
}

function stringToReadable(str: string): Readable {
  // eslint-disable-next-line node/prefer-global/buffer
  return Readable.from(Buffer.from(str))
}

function resultToStreamMetadata(result: APIGatewayProxyStructuredResultV2) {
  return {
    statusCode: result.statusCode,
    headers: result.headers,
    cookies: result.cookies,
  }
}

function responseToStreamMetadata(res: Response) {
  const headers: Record<string, string> = {}
  const cookies: string[] = []

  res.headers.forEach((value, name) => {
    if (name === 'set-cookie')
      cookies.push(value)
    else
      headers[name] = value
  })

  return {
    statusCode: res.status,
    headers,
    cookies,
  }
}

export interface HandleConfigOptions {
  /**
   * This allows you to easier invoke HTTP routes manually by parsing `event.routeKey` for method and path.
   */
  easyRouteKey?: boolean
  /**
   * Overrides the default binary content-type detection.
   * Defaults to `defaultIsContentTypeBinary`.
   */
  isContentTypeBinary?: (contentType: string) => boolean
}

export function streamHandle<
  E extends Env = Env,
  S extends Schema = {},
  BasePath extends string = '/',
>(app: Hono<E, S, BasePath>, handleConfig?: HandleConfigOptions): LambdaHandler<AdapterEvent> {
  // @ts-expect-error awslambda is not a standard API
  return awslambda.streamifyResponse(
    async (event, responseStream, context) => {
      await processConfig(event, context, handleConfig)

      const processor = getProcessor(event)
      try {
        const req = processor.createRequest(event)

        const res = await app.fetch(req, {
          event,
          context,
        })

        if (res.headers.get('$HAAL-returnBody')) {
          const result = (await res.json()) as APIGatewayProxyStructuredResultV2

          // Update response stream metadata
          responseStream = awslambda.HttpResponseStream.from(responseStream, resultToStreamMetadata(result))

          const bodyStream = stringToReadable(result.body || '')

          await pipeline(bodyStream, responseStream)
        }
        else {
          // Update response stream metadata
          responseStream = awslambda.HttpResponseStream.from(responseStream, responseToStreamMetadata(res))

          if (res.body) {
            await writableWriteReadable(responseStream, res.body.getReader())
          }
          else {
            responseStream.write('')
          }
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
export function handle<E extends Env = Env, S extends Schema = {}, BasePath extends string = '/'>(app: Hono<E, S, BasePath>, handleConfig?: HandleConfigOptions): LambdaHandler<AdapterEvent, LambdaHandlerResult> {
  return async (event, context?) => {
    await processConfig(event, context, handleConfig)

    const processor = getProcessor(event)

    const resultOptions: ResultOptions | undefined = handleConfig?.isContentTypeBinary
      ? { isContentTypeBinary: handleConfig.isContentTypeBinary }
      : undefined

    let req: Request
    try {
      req = processor.createRequest(event)
    }
    catch (error) {
      console.error('Error processing request:', error)
      const errorResponse = error instanceof TypeError
        ? new Response('Invalid request', { status: 400 })
        : new Response('Internal Server Error', { status: 500 })
      return processor.createResult(event, errorResponse, resultOptions)
    }

    const res = await app.fetch(req, {
      event,
      context,
    })

    if (res.headers.get('$HAAL-returnBody'))
      return (await res.json()) as LambdaHandlerResult

    return processor.createResult(event, res, resultOptions)
  }
}

async function processConfig(event: AdapterEvent, context?: LambdaContext, handleConfig?: HandleConfigOptions) {
  const _eventCastV2 = event as APIGatewayProxyEventV2
  if (handleConfig?.easyRouteKey) {
    if (!_eventCastV2.routeKey)
      return

    if (!_eventCastV2.requestContext?.http?.path && !_eventCastV2.requestContext?.http?.method) {
      const [method, path] = _eventCastV2.routeKey.split(' ')
      minimalEvent(method, path, _eventCastV2)
    }
  }
}
