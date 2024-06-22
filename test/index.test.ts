import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { klona } from 'klona'
import type { LambdaRequestEvent, LambdaTriggerEvent } from '@namesmt/utils-lambda'
import sampleEvent from './sample-event-v2.json'
import { handle } from '~/handler'
import { createTriggerFactory } from '~/trigger'

function makeSampleEvent({ path = 'path', method = 'GET' }) {
  const event = klona(sampleEvent)

  event.rawPath = event.requestContext.http.path = path
  event.routeKey = event.requestContext.routeKey = `${method} ${path}`
  event.requestContext.http.method = method

  return event as LambdaRequestEvent
}

function makeTriggerEvent(eventSource: string) {
  const event = { eventSource }

  return event as LambdaTriggerEvent
}

describe('basic', () => {
  describe('normal handler', () => {
    describe('simple usage', () => {
      const app = new Hono()
      const triggerFactory = createTriggerFactory(app)

      let shouldBeChanged = ''

      // Registering routes
      app.get('/', c => c.text('Hello Hono!'))
      app.get('/hi', c => c.text('Hi Hono!'))
      triggerFactory.on('test:rootTakeover', '$!', c => c.text('Hello Trigger Event!'))
      triggerFactory.on('test:rootReturn', '$=', c => c.text('Hello Trigger Event!'))
      triggerFactory.on('test:rootReturn', 'changeLet', (c) => {
        shouldBeChanged = 'changed'
        return c.text('')
      })
      triggerFactory.on('test:resObj', 'a1', c => c.text('Hello from a1'))
      triggerFactory.on('test:resObj', 'b2', c => c.text('Hello from b2'))

      // Create handler
      const handler = handle(app)

      it('should process some basic events flawlessly 💅', async () => {
        expect(handler(makeSampleEvent({ path: '/' }))).resolves.toMatchObject({ body: 'Hello Hono!' })
        expect(handler(makeSampleEvent({ path: '/hi' }))).resolves.toMatchObject({ body: 'Hi Hono!' })
        expect(handler(makeTriggerEvent('test:rootTakeover'))).resolves.toMatchObject({ body: 'Hello Trigger Event!' })
        expect(handler(makeTriggerEvent('test:rootReturn'))).resolves.toMatchObject({ body: 'Hello Trigger Event!' })
        expect(shouldBeChanged).toBe('changed')
        expect(handler(makeTriggerEvent('test:resObj'))).resolves.toMatchObject({ body: JSON.stringify({ a1: 'Hello from a1', b2: 'Hello from b2' }) })
      })
    })
  })

  describe.skip('stream handler', () => {
  })
})
