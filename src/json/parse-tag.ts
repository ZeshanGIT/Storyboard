import { validateModifiers } from './tag-registry'
import type { ParsedTag } from './types'

export function parseTag(raw: string): ParsedTag {
  const parts = raw.split(':')
  const component = parts[0] ?? ''
  const modifiers = [...parts.slice(1)].sort()
  validateModifiers(component, modifiers)
  return { component, modifiers }
}
