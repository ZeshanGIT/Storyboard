export function asEditorText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
