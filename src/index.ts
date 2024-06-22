/**
 * @module
 * AWS Lambda Adapter for Hono.
 */

export { handle, streamHandle } from './handler'

export {
  createTriggerFactory,
  getTriggerPath,
  TriggerFactory,
  triggerPathUUID,
} from './trigger'
