import { describe, expect, it } from 'vitest'
import { compilePlaygroundJson } from './compile-playground-json'

const VALID = JSON.stringify(
  {
    title: 'Demo',
    screens: {
      home: {
        title: 'Home',
        nodes: [['Text:h1', 'Hello']],
      },
    },
  },
  null,
  2,
)

describe('compilePlaygroundJson', () => {
  it('accepts valid wireframe JSON', () => {
    const result = compilePlaygroundJson(VALID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document.title).toBe('Demo')
  })

  it('rejects invalid JSON syntax', () => {
    const result = compilePlaygroundJson('{ broken')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0]).toMatch(/JSON/i)
  })

  it('rejects valid JSON with wireframe validation errors', () => {
    const result = compilePlaygroundJson(
      JSON.stringify({
        title: 'X',
        screens: { home: { title: 'Home', nodes: [['Link', { goto: 'missing' }, 'Go']] } },
      }),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
