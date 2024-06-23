/**
 * @module
 * AWS Lambda Adapter for Hono.
 */

export { handle, streamHandle } from './handler'
export * from './types'
export {
  createTriggerFactory,
  getTriggerPath,
  TriggerFactory,
  triggerPathUUID,
} from './trigger'
