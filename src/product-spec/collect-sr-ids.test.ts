import { describe, expect, it } from 'vitest'
import { collectSrIds } from './collect-sr-ids'

describe('collectSrIds', () => {
  it('collects screen-level and tuple SR ids', () => {
    const ids = collectSrIds({
      title: 'T',
      screens: {
        home: {
          sr: 'SR-001',
          nodes: [
            ['Input', 'SR-011', { placeholder: 'Task' }],
            ['Link:primary-btn', 'SR-012', { goto: 'home' }, 'Add'],
          ],
        },
      },
    })
    expect(ids).toEqual(new Set(['SR-001', 'SR-011', 'SR-012']))
  })
})
