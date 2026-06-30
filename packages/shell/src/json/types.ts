import type { CodegenErrorCode } from '@shell/plugin/types'

export type ParsedTag = {
  component: string
  modifiers: readonly string[]
}

export type JsonProps = Readonly<Record<string, unknown>>

export type JsonNode = {
  tag: ParsedTag
  sr?: string
  props: JsonProps
  children?: readonly JsonNode[] | string
  graphLinkId?: string
}

export class JsonBuildError extends Error {
  readonly code: CodegenErrorCode | 'INVALID_NODE' | 'INVALID_DOCUMENT'
  readonly screenId?: string

  constructor(
    code: CodegenErrorCode | 'INVALID_NODE' | 'INVALID_DOCUMENT',
    message: string,
    screenId?: string,
  ) {
    super(message)
    this.name = 'JsonBuildError'
    this.code = code
    this.screenId = screenId
  }
}
