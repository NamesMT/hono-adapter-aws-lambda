import type { APIGatewayProxyEventV2 } from 'aws-lambda'

/**
 * Creates/populates a minimal event with path & method for routing usage purpose.
 * 
 * Will also set `Content-Type` header and stringify body if method is not GET/HEAD 
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

  if (method !== 'GET' && method !== 'HEAD') {
    event.headers ??= {}
    event.headers['content-type'] ??= 'application/json'

    if (typeof event.body !== 'string')
      event.body = JSON.stringify(event.body)
  }

  event.routeKey = event.requestContext.routeKey = `${method} ${path}`
  event.requestContext.http.method = method
  event.rawPath = event.requestContext.http.path = path

  return event as APIGatewayProxyEventV2
}
