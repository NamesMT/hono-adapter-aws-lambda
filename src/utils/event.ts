import type { APIGatewayProxyEventV2 } from 'aws-lambda'

/**
 * Creates/populates a minimal event with path & method for routing usage purpose.
 */
export function minimalEvent(method: string, path: string, baseEvent?: APIGatewayProxyEventV2): APIGatewayProxyEventV2 {
  const event = baseEvent ?? {} as any

  event.requestContext ??= {
    http: {
      method: '',
      path: '',
    },
    routeKey: '',
  }

  event.headers ??= {}
  event.headers['content-type'] ??= 'application/json'

  event.routeKey = event.requestContext.routeKey = `${method} ${path}`
  event.requestContext.http.method = method
  event.rawPath = event.requestContext.http.path = path

  return event as APIGatewayProxyEventV2
}
