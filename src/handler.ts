import crypto from 'node:crypto'
import type { ReadableStreamDefaultReader } from 'node:stream/web'
import type { Env, Hono, Schema } from 'hono'
import type { LambdaEvent } from '@namesmt/utils-lambda'
import type { APIGatewayProxyResult, Handler } from 'aws-lambda'

import type { LambdaContext } from './types'

import { getProcessor } from './common'

// @ts-expect-error CryptoKey missing
globalThis.crypto ??= crypto

async function streamToNodeStream(reader: ReadableStreamDefaultReader<Uint8Array>, writer: NodeJS.WritableStream): Promise<void> {
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
>(app: Hono<E, S, BasePath>): Handler {
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

        const headers: Record<string, string> = {}
        const cookies: string[] = []
        res.headers.forEach((value, name) => {
          if (name === 'set-cookie')
            cookies.push(value)
          else
            headers[name] = value
        })

        // Check content type
        const httpResponseMetadata = {
          statusCode: res.status,
          headers,
          cookies,
        }

        // Update response stream
        // @ts-expect-error awslambda is not a standard API
        responseStream = awslambda.HttpResponseStream.from(responseStream, httpResponseMetadata)

        if (res.body) {
          await streamToNodeStream(res.body.getReader(), responseStream)
        }
        else {
          responseStream.write('')
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
export function handle<E extends Env = Env, S extends Schema = {}, BasePath extends string = '/'>(app: Hono<E, S, BasePath>): ((event: LambdaEvent, lambdaContext?: LambdaContext) => Promise<APIGatewayProxyResult>) {
  return async (event, lambdaContext?) => {
    const processor = getProcessor(event)

    const req = processor.createRequest(event)

    const res = await app.fetch(req, {
      event,
      lambdaContext,
    })

    return processor.createResult(event, res)
  }
}
