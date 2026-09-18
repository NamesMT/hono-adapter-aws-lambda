import type { LambdaEvent, LambdaRequestEvent, LambdaTriggerEvent } from '@namesmt/utils-lambda'
import type { LambdaHandlerResult } from '#src/types.js'
import { Hono } from 'hono'
import { klona } from 'klona'

import { describe, expect, it } from 'vitest'

import { handle } from '#src/handler.js'
import { createTriggerFactory } from '#src/trigger.js'
import sampleEvent from './sample-event-v2.json'

type ShimSimpleHandler = (event: LambdaEvent) => Promise<LambdaHandlerResult>

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
      const handler = handle(app) as ShimSimpleHandler

      it('should process some basic events flawlessly 💅', async () => {
        await expect(handler(makeSampleEvent({ path: '/' }))).resolves.toMatchObject({ body: 'Hello Hono!' })
        await expect(handler(makeSampleEvent({ path: '/hi' }))).resolves.toMatchObject({ body: 'Hi Hono!' })
        await expect(handler(makeTriggerEvent('test:rootTakeover'))).resolves.toMatchObject({ body: 'Hello Trigger Event!' })
        await expect(handler(makeTriggerEvent('test:rootReturn'))).resolves.toMatchObject({ body: 'Hello Trigger Event!' })
        expect(shouldBeChanged).toBe('changed')
        await expect(handler(makeTriggerEvent('test:resObj'))).resolves.toMatchObject({ body: JSON.stringify({ a1: 'Hello from a1', b2: 'Hello from b2' }) })
      })
    })
  })

  describe.skip('stream handler', () => {
  })
})
