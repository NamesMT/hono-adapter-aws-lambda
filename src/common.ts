import type { AdapterEvent } from './types'

import { albProcessor, isLatticeEventV2, isProxyEventALB, isProxyEventV2, latticeV2Processor, v1Processor, v2Processor } from './request'
import { isTriggerEvent, triggerProcessor } from './trigger'

const CONTENT_TYPE_TEXT_REGEX = /^text\/(?:plain|html|css|javascript|csv)|(?:\/|\+)(?:json|xml)\s*(?:;|$)/
const CONTENT_ENCODING_IDENTITY_REGEX = /^identity$/i

/**
 * Check if the given content type is binary.
 * This is the default used by `handle`/`streamHandle` and may be overridden via the
 * `isContentTypeBinary` option.
 */
export function defaultIsContentTypeBinary(contentType: string): boolean {
  return !CONTENT_TYPE_TEXT_REGEX.test(contentType)
}

export function isContentTypeBinary(contentType: string) {
  return defaultIsContentTypeBinary(contentType)
}

export function isContentEncodingBinary(contentEncoding: string | null) {
  return !!contentEncoding && !CONTENT_ENCODING_IDENTITY_REGEX.test(contentEncoding)
}

export interface ResultOptions {
  isContentTypeBinary?: (contentType: string) => boolean
}

export abstract class EventProcessor<E extends AdapterEvent> {
  abstract createRequest(event: E): Request

  abstract createResult(event: E, res: Response, options?: ResultOptions): Promise<any>
}

export function getProcessor(event: AdapterEvent): EventProcessor<AdapterEvent> {
  if (isTriggerEvent(event))
    return triggerProcessor
  if (isProxyEventALB(event))
    return albProcessor

  if (isProxyEventV2(event))
    return v2Processor

  if (isLatticeEventV2(event))
    return latticeV2Processor

  return v1Processor
}
