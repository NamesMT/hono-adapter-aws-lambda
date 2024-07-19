import crypto from 'node:crypto'
import type { ReadableStreamDefaultReader } from 'node:stream/web'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { Env, Hono, Schema } from 'hono'
import type { LambdaEvent } from '@namesmt/utils-lambda'

import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import type { LambdaContext, LambdaHandler, LambdaHandlerResult } from './types'

import { getProcessor } from './common'

// @ts-expect-error CryptoKey missing
globalThis.crypto ??= crypto

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

export function streamHandle<
  E extends Env = Env,
  S extends Schema = {},
  BasePath extends string = '/',
>(app: Hono<E, S, BasePath>): LambdaHandler<LambdaEvent> {
  // @ts-expect-error awslambda is not a standard API
  return awslambda.streamifyResponse(
    async (event: LambdaEvent, responseStream: NodeJS.WritableStream, context: LambdaContext) => {
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
export function handle<E extends Env = Env, S extends Schema = {}, BasePath extends string = '/'>(app: Hono<E, S, BasePath>): LambdaHandler<LambdaEvent, LambdaHandlerResult> {
  return async (event, lambdaContext?) => {
    const processor = getProcessor(event)

    const req = processor.createRequest(event)

    const res = await app.fetch(req, {
      event,
      lambdaContext,
    })

    if (res.headers.get('$HAAL-returnBody'))
      return (await res.json()) as LambdaHandlerResult

    return processor.createResult(event, res)
  }
}
