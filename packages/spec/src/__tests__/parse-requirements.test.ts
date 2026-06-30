import { describe, expect, it } from 'vitest'
import { parseRequirementsFile } from '../parse-requirements.js'

const SAMPLE = {
  structural: { 'SR-001': { description: 'Home screen' } },
  behavioral: {
    'BR-001': {
      description: 'Create task',
      children: { '1': { description: 'Disable while saving' } },
    },
  },
}

describe('parseRequirementsFile', () => {
  it('parses valid requirements', () => {
    const result = parseRequirementsFile(SAMPLE)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.structural['SR-001'].description).toBe('Home screen')
    }
  })
})
