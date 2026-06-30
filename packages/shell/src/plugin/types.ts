import type { Root } from 'mdast'

export type LinkClassification =
  | 'screen-edge'
  | 'modal'
  | 'reserved'
  | 'disabled-skip'
  | 'invalid-missing-goto'
  | 'invalid-expression-goto'
  | 'invalid-target'

export type ClassifiedLink = {
  classification: LinkClassification
  goto?: string
  label?: string
  linkId?: string
  toScreenId?: string
}

export type MdxScreen = {
  id: string
  title: string
  order: number
  jsx: string
  modalIds: readonly string[]
  links: readonly ClassifiedLink[]
  note?: string
}

export type MdxDocument = {
  tree: Root
  screens: readonly MdxScreen[]
}

export type ExtractedScreen = {
  id: string
  title: string
  jsx: string
  order: number
  modalIds: readonly string[]
  links: readonly ClassifiedLink[]
}

export type { NavigationEdge, NavigationGraph, NavigationGraphNode } from '../types/navigation'

export type CodegenErrorCode =
  | 'DUPLICATE_SCREEN_ID'
  | 'DUPLICATE_MODAL_ID'
  | 'MISSING_SCREEN_ID'
  | 'MISSING_MODAL_ID'
  | 'INVALID_GOTO'
  | 'INVALID_TEXT'
  | 'PARSE_ERROR'

export class CodegenError extends Error {
  readonly code: CodegenErrorCode
  readonly screenId?: string

  constructor(code: CodegenErrorCode, message: string, screenId?: string) {
    super(message)
    this.name = 'CodegenError'
    this.code = code
    this.screenId = screenId
  }
}

export type CodegenResult =
  | { ok: true; screens: ExtractedScreen[] }
  | { ok: false; errors: CodegenError[] }
