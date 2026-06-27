export type ExtractedScreen = {
  id: string
  title: string
  jsx: string
  order: number
}

export type NavigationEdge = {
  id: string
  fromScreenId: string
  toScreenId: string
  linkId: string
  label?: string
}

export type NavigationGraphNode = {
  id: string
  title: string
  note?: string
  order: number
  isEntry: boolean
}

export type NavigationGraph = {
  nodes: readonly NavigationGraphNode[]
  edges: readonly NavigationEdge[]
}

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
