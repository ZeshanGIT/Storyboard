import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { screenIdToComponentName, screenIdToScreensKey } from './naming'
import type { ExtractedScreen } from './types'

const WIREFRAME_COMPONENTS = [
  'Screen',
  'Text',
  'Link',
  'Input',
  'Container',
  'Image',
  'Icon',
  'Modal',
  'TopBar',
  'Divider',
] as const

function wireframeComponentsUsed(jsx: string): string[] {
  return WIREFRAME_COMPONENTS.filter((name) => new RegExp(`<${name}[\\s/>]`).test(jsx))
}

function wireframeImportLine(screens: ExtractedScreen[]): string {
  const allJsx = screens.map((s) => s.jsx).join('\n')
  const used = wireframeComponentsUsed(allJsx)
  return `import { ${used.join(', ')} } from '../components/wireframe'`
}

const HEADER = '// AUTO-GENERATED — do not edit\n\n'

export async function generateWireframeFiles(
  screens: ExtractedScreen[],
  outDir: string,
): Promise<void> {
  await mkdir(outDir, { recursive: true })

  const mapEntries = screens.map((s) => `  ${screenIdToScreensKey(s.id)}: '${s.id}',`).join('\n')

  const mapContent = `${HEADER}export const Screens = {\n${mapEntries}\n} as const\n\nexport type ScreenId = (typeof Screens)[keyof typeof Screens]\n`

  const componentNames = screens.map((s) => screenIdToComponentName(s.id))
  const componentExports = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      return `export function ${name}() {\n  return (\n    ${s.jsx}\n  )\n}`
    })
    .join('\n\n')

  const needsScreens = screens.some((s) => s.jsx.includes('Screens.'))
  const screensImports = [
    wireframeImportLine(screens),
    ...(needsScreens ? ["import { Screens } from './screens-map.generated'"] : []),
  ].join('\n')

  const screensContent = `${HEADER}${screensImports}\n\n${componentExports}\n`

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
