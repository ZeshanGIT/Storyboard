import { describe, expect, it } from 'vitest'
import { layoutNavigationGraph } from './layout-navigation-graph'

describe('layoutNavigationGraph', () => {
  it('assigns positions to all node ids', () => {
    const positions = layoutNavigationGraph(
      [
        { id: 'home', width: 200, height: 100 },
        { id: 'login', width: 200, height: 100 },
      ],
      [{ id: 'e1', from: 'home', to: 'login' }],
    )

    expect(positions.get('home')).toEqual(
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
    )
    expect(positions.get('login')).toEqual(
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
    )
    expect(positions.get('home')?.y).toBeLessThan(positions.get('login')?.y ?? 0)
  })
})
