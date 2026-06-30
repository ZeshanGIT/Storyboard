import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadJsonDocumentBundle } from './json-content-loader'

const MIN_SPEC = {
  title: 'Todo',
  screens: {
    home: {
      title: 'Home',
      nodes: [['Text', 'Hello']],
    },
  },
}

describe('loadJsonDocumentBundle', () => {
  it('builds bundle from onespec/spec.json', () => {
    const root = mkdtempSync(join(tmpdir(), 'sb-load-'))
    const dir = join(root, 'onespec')
    mkdirSync(dir)
    writeFileSync(join(dir, 'spec.json'), JSON.stringify(MIN_SPEC))
    const bundle = loadJsonDocumentBundle(dir)
    expect(bundle.slug).toBe('spec')
    expect(bundle.source).toBe('json')
    expect(bundle.routes).toHaveLength(1)
    expect(bundle.routes[0].id).toBe('home')
  })
})
