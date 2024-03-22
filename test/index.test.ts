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

function makeTriggerEvent(eventSource: string) {
  const event = { eventSource }

  return event
}

describe('basic', () => {
  describe('normal handler', () => {
    describe('simple usage', () => {
      const app = new Hono()

      // Registering routes
      app.get('/', c => c.text('Hello Hono!'))
      app.get('/hi', c => c.text('Hi Hono!'))
      app.on('TRIGGER', 'test:simple', c => c.text('Hello Trigger Event!'))

      // Create handler
      const handler = handle(app)

      it('should process some basic events flawlessly 💅', async () => {
        expect(handler(makeSampleEvent({ path: '/' }))).resolves.toMatchObject({ body: 'Hello Hono!' })
        expect(handler(makeSampleEvent({ path: '/hi' }))).resolves.toMatchObject({ body: 'Hi Hono!' })
        expect(handler(makeTriggerEvent('test:simple'))).resolves.toMatchObject({ body: 'Hello Trigger Event!' })
      })
    })

    describe('with basePath', () => {
      const app = new Hono().basePath('/based')

      // Registering routes
      app.get('/', c => c.text('Hello Hono!'))
      app.get('/hi', c => c.text('Hi Hono!'))
      app.on('TRIGGER', 'test:simple', c => c.text('Hello Trigger Event!'))

      // Create handler
      const handler = handle(app)

      it('should process some basic events flawlessly 💅', async () => {
        expect(handler(makeSampleEvent({ path: '/based' }))).resolves.toMatchObject({ body: 'Hello Hono!' })
        expect(handler(makeSampleEvent({ path: '/based/hi' }))).resolves.toMatchObject({ body: 'Hi Hono!' })
        expect(handler(makeTriggerEvent('test:simple'))).resolves.toMatchObject({ body: 'Hello Trigger Event!' })
      })
    })

    // TODO: support trigger events in route grouping
    describe('with route grouping)', () => {
      const grouped = new Hono()

      // Registering routes
      grouped.get('/', c => c.text('Hello Hono!'))
      grouped.get('/hi', c => c.text('Hi Hono!'))
      grouped.on('TRIGGER', 'test:simple', c => c.text('Hello Trigger Event!'))

      const app = new Hono()
      app.route('/grouped', grouped)

      // Create handler
      const handler = handle(app)

      it('should process some basic events flawlessly 💅', async () => {
        expect(handler(makeSampleEvent({ path: '/grouped' }))).resolves.toMatchObject({ body: 'Hello Hono!' })
        expect(handler(makeSampleEvent({ path: '/grouped/hi' }))).resolves.toMatchObject({ body: 'Hi Hono!' })
      })

      it('should fail trigger event', async () => {
        expect(handler(makeTriggerEvent('test:simple'))).resolves.toMatchObject({ body: '404 Not Found' })
      })
    })
  })

  describe.skip('stream handler', () => {
  })
})
