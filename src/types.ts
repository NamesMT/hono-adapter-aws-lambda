import type { APIGatewayProxyResult, APIGatewayProxyStructuredResultV2, Handler } from 'aws-lambda'

export type { Context as LambdaContext } from 'aws-lambda'
export type { LambdaEvent, LambdaTriggerEvent, LambdaRequestEvent } from '@namesmt/utils-lambda'

export type LambdaHandler<TEvent = any, TResult = any> = Handler<TEvent, TResult>
export type LambdaHandlerResult = APIGatewayProxyResult | APIGatewayProxyStructuredResultV2
