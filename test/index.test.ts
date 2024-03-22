import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { klona } from 'klona'
import sampleEvent from './sample-event-v2.json'
import { handle, streamHandle } from '~/handler'

function makeSampleEvent({ path = 'path', method = 'GET' }) {
  const event = klona(sampleEvent)

  event.rawPath = event.requestContext.http.path = path
  event.routeKey = event.requestContext.routeKey = `${method} ${path}`
  event.requestContext.http.method = method

  return event
}

describe('basic', () => {
  describe('normal handler', () => {
    const app = new Hono()

    // Registering routes
    app.get('/', c => c.text('Hello Hono!'))

    // Create handler
    const handler = handle(app)

    it('should process some basic events flawlessly 💅', async () => {
      expect(handler(makeSampleEvent({ path: '/' }))).resolves.toMatchObject({ body: 'Hello Hono!' })
    })
  })

  describe.skip('stream handler', () => {
  })
})
