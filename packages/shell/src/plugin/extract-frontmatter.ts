function titleFromSlug(filename: string): string {
  const slug = filename.replace(/\.mdx$/i, '')
  return slug
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parseTitleFromYaml(yaml: string): string | undefined {
  const titleMatch = yaml.match(/^title:\s*(?:"([^"]*)"|'([^']*)'|(.+?))\s*$/m)
  if (!titleMatch) return undefined
  return (titleMatch[1] ?? titleMatch[2] ?? titleMatch[3]?.trim()) || undefined
}

export type FrontmatterResult = {
  title: string
  body: string
}

export function extractFrontmatter(source: string, filename: string): FrontmatterResult {
  const fmMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/)
  if (!fmMatch) {
    return { title: titleFromSlug(filename), body: source }
  }

  const title = parseTitleFromYaml(fmMatch[1]) ?? titleFromSlug(filename)
  return { title, body: source.slice(fmMatch[0].length) }
}
