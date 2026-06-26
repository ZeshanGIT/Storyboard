export type ExtractedScreen = {
  id: string
  title: string
  jsx: string
  order: number
}

export type CodegenErrorCode =
  | 'DUPLICATE_SCREEN_ID'
  | 'MISSING_SCREEN_ID'
  | 'INVALID_GOTO'
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
