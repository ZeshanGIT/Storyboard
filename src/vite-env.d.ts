/// <reference types="vite/client" />
/// <reference types="mdx" />

declare module '*.mdx?raw' {
  const content: string
  export default content
}

declare module 'virtual:wireframe-codegen-state' {
  export type CodegenErrorInfo = {
    code: string
    message: string
    screenId: string | null
  }

  export const codegenErrors: readonly CodegenErrorInfo[]
  export const codegenError: CodegenErrorInfo | null
}
