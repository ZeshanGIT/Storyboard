import { codegenError, codegenErrors } from 'virtual:wireframe-codegen-state'

export type CodegenErrorInfo = {
  code: string
  message: string
  screenId: string | null
}

export function getCodegenErrors(): readonly CodegenErrorInfo[] {
  return codegenErrors
}

export function getCodegenError(): CodegenErrorInfo | null {
  return codegenError
}
