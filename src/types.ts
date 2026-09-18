import type { LambdaEvent, LambdaRequestEvent, LambdaTriggerEvent } from '@namesmt/utils-lambda'
import type { APIGatewayProxyResult, APIGatewayProxyStructuredResultV2, Handler } from 'aws-lambda'

export type { LambdaEvent, LambdaRequestEvent, LambdaTriggerEvent }
export type { Context as LambdaContext } from 'aws-lambda'

export type LambdaHandler<TEvent = any, TResult = any> = Handler<TEvent, TResult>
export type LambdaHandlerResult = APIGatewayProxyResult | APIGatewayProxyStructuredResultV2

/**
 * Amazon VPC Lattice v2 event.
 * Not yet available in `@types/aws-lambda`, so defined locally.
 */
export interface LatticeRequestContextV2 {
  serviceNetworkArn: string
  serviceArn: string
  targetGroupArn: string
  region: string
  timeEpoch: string
  identity: {
    sourceVpcArn?: string
    type?: string
    principal?: string
    principalOrgID?: string
    sessionName?: string
    x509IssuerOu?: string
    x509SanDns?: string
    x509SanNameCn?: string
    x509SanUri?: string
    x509SubjectCn?: string
  }
}

export interface LatticeProxyEventV2 {
  version: string
  path: string
  method: string
  headers: Record<string, string[] | undefined>
  queryStringParameters: Record<string, string[] | undefined>
  body: string | null
  isBase64Encoded: boolean
  requestContext: LatticeRequestContextV2
}

/**
 * All events the adapter handles: request, trigger, and VPC Lattice.
 */
export type AdapterEvent = LambdaEvent | LatticeProxyEventV2
