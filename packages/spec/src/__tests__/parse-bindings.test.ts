import { describe, expect, it } from 'vitest'
import { parseBindingsFile } from '../parse-bindings.js'

describe('parseBindingsFile', () => {
  it('parses screen-only and SR-anchored bindings', () => {
    const result = parseBindingsFile({
      'BR-001': [['home', 'SR-012']],
      'BR-004': [['home']],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value['BR-001'][0]).toEqual(['home', 'SR-012'])
      expect(result.value['BR-004'][0]).toEqual(['home'])
    }
  })
})
