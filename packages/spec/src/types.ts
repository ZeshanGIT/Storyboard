export type ProductSpec = {
  storyboardDir: string
  spec: unknown
  requirements: unknown
  bindings: unknown
}

export type ValidationResult = {
  ok: boolean
  errors: { code: string; message: string }[]
  warnings: { code: string; message: string }[]
}
