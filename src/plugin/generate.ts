import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { screenIdToComponentName, screenIdToScreensKey } from './naming'
import type { ExtractedScreen } from './types'

const HEADER = '// AUTO-GENERATED — do not edit\n\n'

export async function generateWireframeFiles(
  screens: ExtractedScreen[],
  outDir: string,
): Promise<void> {
  await mkdir(outDir, { recursive: true })

  const mapEntries = screens
    .map((s) => `  ${screenIdToScreensKey(s.id)}: '${s.id}',`)
    .join('\n')

  const mapContent = `${HEADER}export const Screens = {\n${mapEntries}\n} as const\n\nexport type ScreenId = (typeof Screens)[keyof typeof Screens]\n`

  const componentNames = screens.map((s) => screenIdToComponentName(s.id))
  const componentExports = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      return `export function ${name}() {\n  return (\n    ${s.jsx}\n  )\n}`
    })
    .join('\n\n')

  const screensContent = `${HEADER}import { Screen, Text, Link } from '../components/wireframe'\nimport { Screens } from './screens-map.generated'\n\n${componentExports}\n`

  const routeImports = componentNames.join(', ')
  const routeEntries = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      return `  {\n    id: '${s.id}',\n    path: '/${s.id}',\n    component: ${name},\n  }`
    })
    .join(',\n')

  const routesContent = `${HEADER}import { ${routeImports} } from './screens.generated'\n\nexport const routes = [\n${routeEntries},\n] as const\n`

  await writeFile(join(outDir, 'screens-map.generated.ts'), mapContent, 'utf8')
  await writeFile(join(outDir, 'screens.generated.tsx'), screensContent, 'utf8')
  await writeFile(join(outDir, 'routes.generated.tsx'), routesContent, 'utf8')
}
