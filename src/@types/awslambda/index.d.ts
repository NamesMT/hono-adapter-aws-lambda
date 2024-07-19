import type { APIGatewayProxyEventV2, Context, Handler } from 'aws-lambda'

declare global {
  namespace awslambda {
    export namespace HttpResponseStream {
      function from(writable: NodeJS.WritableStream, metadata: any): NodeJS.WritableStream
    }

    export type ResponseStream = NodeJS.WritableStream & {
      setContentType: (type: string) => void
    }

    export type StreamifyHandler = (event: APIGatewayProxyEventV2, responseStream: ResponseStream, context: Context) => Promise<any>

    export function streamifyResponse(handler: StreamifyHandler): Handler<APIGatewayProxyEventV2>
  }
}
