import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { screenIdToComponentName } from './naming'
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

function extractModalIds(screens: ExtractedScreen[]): string[] {
  const ids = new Set<string>()
  const pattern = /<Modal\s[^>]*\bid="([^"]+)"/g

  for (const screen of screens) {
    for (const match of screen.jsx.matchAll(pattern)) {
      ids.add(match[1])
    }
  }

  return [...ids].sort()
}

const HEADER = '// AUTO-GENERATED — do not edit\n\n'

export async function generateWireframeFiles(
  screens: ExtractedScreen[],
  outDir: string,
): Promise<void> {
  await mkdir(outDir, { recursive: true })

  const modalIds = extractModalIds(screens)
  const modalIdEntries = modalIds.map((id) => `  '${id}',`).join('\n')
  const modalIdsBlock =
    modalIds.length > 0
      ? `export const modalIds = [\n${modalIdEntries}\n] as const\n`
      : 'export const modalIds = [] as const\n'

  const componentNames = screens.map((s) => screenIdToComponentName(s.id))
  const componentExports = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      return `export function ${name}() {\n  return (\n    ${s.jsx}\n  )\n}`
    })
    .join('\n\n')

  const screensContent = `${HEADER}${wireframeImportLine(screens)}\n\n${componentExports}\n`

  const routeImports = componentNames.join(', ')
  const routeEntries = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      return `  {\n    id: '${s.id}',\n    path: '/${s.id}',\n    component: ${name},\n  }`
    })
    .join(',\n')

  const routesContent = `${HEADER}import { ${routeImports} } from './screens.generated'

export const routes = [
${routeEntries},
] as const

${modalIdsBlock}
export type ScreenRouteId = (typeof routes)[number]['id']
export type ModalId = (typeof modalIds)[number]
export type ReservedGoto = '_close' | '_back'
export type GotoTarget = ScreenRouteId | ModalId | ReservedGoto
`

  await writeFile(join(outDir, 'screens.generated.tsx'), screensContent, 'utf8')
  await writeFile(join(outDir, 'routes.generated.tsx'), routesContent, 'utf8')
}
