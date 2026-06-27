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

const HEADER = '// AUTO-GENERATED — do not edit\n\n'

function wireframeComponentsUsed(jsx: string): string[] {
  return WIREFRAME_COMPONENTS.filter((name) => new RegExp(`<${name}[\\s/>]`).test(jsx))
}

function wireframeImportLine(screens: ExtractedScreen[]): string {
  const allJsx = screens.map((s) => s.jsx).join('\n')
  const used = wireframeComponentsUsed(allJsx)
  return `import { ${used.join(', ')} } from '../../../components/wireframe'`
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

function buildScreensFile(screens: ExtractedScreen[]): string {
  const componentExports = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      return `export function ${name}() {\n  return (\n    ${s.jsx}\n  )\n}`
    })
    .join('\n\n')

  return `${HEADER}${wireframeImportLine(screens)}\n\n${componentExports}\n`
}

function buildRoutesFile(screens: ExtractedScreen[]): string {
  const componentNames = screens.map((s) => screenIdToComponentName(s.id))
  const routeImports = componentNames.join(', ')
  const routeEntries = screens
    .map((s) => {
      const name = screenIdToComponentName(s.id)
      return `  {\n    id: '${s.id}',\n    path: '/${s.id}',\n    component: ${name},\n  }`
    })
    .join(',\n')

  const modalIds = extractModalIds(screens)
  const modalIdEntries = modalIds.map((id) => `  '${id}',`).join('\n')
  const modalIdsBlock =
    modalIds.length > 0
      ? `export const modalIds = [\n${modalIdEntries}\n] as const\n`
      : 'export const modalIds = [] as const\n'

  return `${HEADER}import { ${routeImports} } from './screens.generated'

export const routes = [
${routeEntries},
] as const

${modalIdsBlock}`
}

export async function generateDocumentFiles(
  slug: string,
  screens: ExtractedScreen[],
  outDir: string,
): Promise<void> {
  const docDir = join(outDir, 'documents', slug)
  await mkdir(docDir, { recursive: true })

  await writeFile(join(docDir, 'screens.generated.tsx'), buildScreensFile(screens), 'utf8')
  await writeFile(join(docDir, 'routes.generated.tsx'), buildRoutesFile(screens), 'utf8')
}

export type DocumentScreensMap = ReadonlyMap<string, readonly ExtractedScreen[]>

export async function generateAggregateRoutes(
  documentScreens: DocumentScreensMap,
  outDir: string,
): Promise<void> {
  const primarySlug = documentScreens.has('wireframe')
    ? 'wireframe'
    : [...documentScreens.keys()][0]

  const screenIds = new Set<string>()
  const modalIds = new Set<string>()
  for (const screens of documentScreens.values()) {
    for (const screen of screens) {
      screenIds.add(screen.id)
    }
    for (const id of extractModalIds([...screens])) {
      modalIds.add(id)
    }
  }

  const screenIdUnion =
    [...screenIds]
      .sort()
      .map((id) => `'${id}'`)
      .join(' | ') || 'never'
  const modalIdUnion =
    [...modalIds]
      .sort()
      .map((id) => `'${id}'`)
      .join(' | ') || 'never'

  const routeImport =
    primarySlug === undefined
      ? ''
      : `import { routes as ${slugToRoutesAlias(primarySlug)} } from './documents/${primarySlug}/routes.generated'\n`
  const primaryRoutesExport =
    primarySlug === undefined
      ? 'export const routes = [] as const\n'
      : `export const routes = ${slugToRoutesAlias(primarySlug)}\n`

  const content = `${HEADER}${routeImport}
${primaryRoutesExport}
export type ScreenRouteId = ${screenIdUnion}
export type ModalId = ${modalIdUnion}
export type ReservedGoto = '_close' | '_back'
export type GotoTarget = ScreenRouteId | ModalId | ReservedGoto
`

  await writeFile(join(outDir, 'routes.generated.tsx'), content, 'utf8')
}

function slugToRoutesAlias(slug: string): string {
  return `${slug.replace(/[-_](\w)/g, (_, c: string) => c.toUpperCase())}Routes`
}

// Kept for unit tests that call the legacy entry point.
export async function generateWireframeFiles(
  screens: ExtractedScreen[],
  outDir: string,
): Promise<void> {
  await generateDocumentFiles('wireframe', screens, outDir)
  await generateAggregateRoutes(new Map([['wireframe', screens]]), outDir)
}
