import type { ProductSpec, ValidationResult } from './types.js'

export type { ProductSpec, ValidationResult } from './types.js'

export async function loadProductSpec(_storyboardDir: string): Promise<ProductSpec> {
  throw new Error('P1 not migrated yet')
}

export function validateProductSpec(_spec: ProductSpec): ValidationResult {
  return { ok: true, errors: [], warnings: [] }
}
