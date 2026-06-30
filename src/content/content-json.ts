const PRIMARY_JSON = 'storyboard.json'
const DEMO_JSON = 'wireframe.json'

const jsonModules = import.meta.glob('./*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>

export type ContentJsonSource = {
  baseSlug: string
  filename: string
  raw: Record<string, unknown>
}

function jsonSortRank(filename: string): number {
  if (filename === PRIMARY_JSON) return 0
  if (filename === DEMO_JSON) return 1
  return 2
}

function sortJsonPaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const aName = a.split('/').pop() ?? ''
    const bName = b.split('/').pop() ?? ''
    const rank = jsonSortRank(aName) - jsonSortRank(bName)
    return rank !== 0 ? rank : aName.localeCompare(bName)
  })
}

export const contentJsonSources: readonly ContentJsonSource[] = sortJsonPaths(
  Object.keys(jsonModules),
).map((path) => {
  const filename = path.split('/').pop() ?? ''
  const baseSlug = filename.replace(/\.json$/i, '')
  return {
    baseSlug,
    filename,
    raw: jsonModules[path],
  }
})

export function resolveJsonDocumentSlug(
  baseSlug: string,
  reservedSlugs: ReadonlySet<string>,
): string {
  if (!reservedSlugs.has(baseSlug)) return baseSlug
  const suffixed = `${baseSlug}-json`
  if (!reservedSlugs.has(suffixed)) return suffixed
  let index = 2
  while (reservedSlugs.has(`${baseSlug}-json-${index}`)) {
    index += 1
  }
  return `${baseSlug}-json-${index}`
}

export function defaultJsonBaseSlug(): string {
  const storyboard = contentJsonSources.find((doc) => doc.baseSlug === 'storyboard')
  const wireframe = contentJsonSources.find((doc) => doc.baseSlug === 'wireframe')
  return storyboard?.baseSlug ?? wireframe?.baseSlug ?? contentJsonSources[0]?.baseSlug ?? ''
}
