import type { LambdaEvent } from '@namesmt/utils-lambda'

import { albProcessor, isProxyEventALB, isProxyEventV2, v1Processor, v2Processor } from './request'
import { isTriggerEvent, triggerProcessor } from './trigger'

const CONTENT_TYPE_TEXT_REGEX = /^(?:text\/(?:plain|html|css|javascript|csv).*|application\/(?:.*json|.*xml).*|image\/svg\+xml.*)$/
const CONTENT_ENCODING_BINARY_REGEX = /^(?:gzip|deflate|compress|br)/

export function isContentTypeBinary(contentType: string) {
  return !CONTENT_TYPE_TEXT_REGEX.test(contentType)
}

export function isContentEncodingBinary(contentEncoding: string | null) {
  if (contentEncoding === null) {
    return false
  }
  return CONTENT_ENCODING_BINARY_REGEX.test(contentEncoding)
}

export abstract class EventProcessor<E extends LambdaEvent> {
  abstract createRequest(event: E): Request

  abstract createResult(event: E, res: Response): Promise<any>
}

export function getProcessor(event: LambdaEvent): EventProcessor<LambdaEvent> {
  if (isTriggerEvent(event))
    return triggerProcessor
  if (isProxyEventALB(event))
    return albProcessor

  if (isProxyEventV2(event))
    return v2Processor

  return v1Processor
}
