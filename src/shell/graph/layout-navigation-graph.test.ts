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

  it('spaces nodes using each node own width and height', () => {
    const positions = layoutNavigationGraph(
      [
        { id: 'home', width: 120, height: 80 },
        { id: 'login', width: 280, height: 360 },
      ],
      [{ id: 'e1', from: 'home', to: 'login' }],
    )

    const home = positions.get('home')
    const login = positions.get('login')
    expect(home).toBeDefined()
    expect(login).toBeDefined()
    expect(login?.y).toBeGreaterThan((home?.y ?? 0) + 80)
  })
})
