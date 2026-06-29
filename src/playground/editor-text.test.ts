import { describe, expect, it } from 'vitest'
import { asEditorText } from './editor-text'

describe('asEditorText', () => {
  it('returns strings unchanged', () => {
    expect(asEditorText('hello')).toBe('hello')
  })

  it('coerces non-string editor values to empty string', () => {
    expect(asEditorText(undefined)).toBe('')
    expect(asEditorText({ default: 'fn' })).toBe('')
  })
})
