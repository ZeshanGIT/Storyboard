import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { generateWireframeFiles } from './generate'
import type { ExtractedScreen } from './types'

const screens: ExtractedScreen[] = [
  {
    id: 'home',
    title: 'Home',
    jsx: '<Screen id="home" title="Home"><Text>Hi</Text></Screen>',
    order: 0,
    modalIds: [],
    links: [],
  },
  {
    id: 'login',
    title: 'Login',
    jsx: '<Screen id="login" title="Login"><Text>In</Text></Screen>',
    order: 1,
    modalIds: [],
    links: [],
  },
]

describe('generateWireframeFiles', () => {
  it('writes screens and routes with GotoTarget types', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wfx-'))
    await generateWireframeFiles(screens, dir)

    const routes = await readFile(join(dir, 'routes.generated.tsx'), 'utf8')
    const components = await readFile(
      join(dir, 'documents/wireframe/screens.generated.tsx'),
      'utf8',
    )
    const docRoutes = await readFile(join(dir, 'documents/wireframe/routes.generated.tsx'), 'utf8')
    const navGraph = await readFile(
      join(dir, 'documents/wireframe/navigation-graph.generated.ts'),
      'utf8',
    )

    expect(docRoutes).toContain("id: 'home'")
    expect(docRoutes).toContain("path: '/home'")
    expect(docRoutes).toContain('component: Home')
    expect(routes).toContain('export type ScreenRouteId')
    expect(routes).toContain('export type GotoTarget')
    expect(components).toContain('export function Home()')
    expect(components).toContain('<Text>Hi</Text>')
    expect(components).not.toContain('Screens')
    expect(navGraph).toContain('export const navigationGraph')
    expect(navGraph).toContain('"nodes"')
    expect(navGraph).toContain('"edges"')
  })

  it('includes modal ids in generated types', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wfx-'))
    const withModal: ExtractedScreen[] = [
      {
        id: 'home',
        title: 'Home',
        jsx: '<Screen id="home"><Link goto="confirm">Open</Link><Modal id="confirm" /></Screen>',
        order: 0,
        modalIds: ['confirm'],
        links: [],
      },
    ]
    await generateWireframeFiles(withModal, dir)

    const routes = await readFile(join(dir, 'routes.generated.tsx'), 'utf8')
    const docRoutes = await readFile(join(dir, 'documents/wireframe/routes.generated.tsx'), 'utf8')
    expect(routes).toContain("'confirm'")
    expect(docRoutes).toContain("'confirm'")
    expect(docRoutes).toContain("modalIds: ['confirm']")
    expect(routes).toContain('export type ModalId')
  })
})
