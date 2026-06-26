import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { generateWireframeFiles } from './generate'
import type { ExtractedScreen } from './types'

const screens: ExtractedScreen[] = [
  { id: 'home', title: 'Home', jsx: '<Screen id="home" title="Home"><Text>Hi</Text></Screen>', order: 0 },
  { id: 'login', title: 'Login', jsx: '<Screen id="login" title="Login"><Text>In</Text></Screen>', order: 1 },
]

describe('generateWireframeFiles', () => {
  it('writes three generated files', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'wfx-'))
    await generateWireframeFiles(screens, dir)

    const map = await readFile(join(dir, 'screens-map.generated.ts'), 'utf8')
    const routes = await readFile(join(dir, 'routes.generated.tsx'), 'utf8')
    const components = await readFile(join(dir, 'screens.generated.tsx'), 'utf8')

    expect(map).toContain("Home: 'home'")
    expect(map).toContain("Login: 'login'")
    expect(routes).toContain("path: '/home'")
    expect(routes).toContain('component: Home')
    expect(components).toContain('export function Home()')
    expect(components).toContain('<Text>Hi</Text>')
  })
})
