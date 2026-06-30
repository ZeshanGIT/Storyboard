import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildJsonDocument } from '@/json/build-json-document'
import { parseBindingsFile } from './parse-bindings'
import { parseRequirementsFile } from './parse-requirements'
import type { ProductSpec, WireframeSpec } from './types'

async function readJson(path: string): Promise<unknown> {
  const text = await readFile(path, 'utf8')
  return JSON.parse(text) as unknown
}

export async function loadProductSpec(storyboardDir: string): Promise<ProductSpec> {
  const specPath = join(storyboardDir, 'spec.json')
  const requirementsPath = join(storyboardDir, 'requirements.json')
  const bindingsPath = join(storyboardDir, 'bindings.json')

  const [specRaw, requirementsRaw, bindingsRaw] = await Promise.all([
    readJson(specPath),
    readJson(requirementsPath),
    readJson(bindingsPath),
  ])

  const built = buildJsonDocument(specRaw)
  if (!built.ok) {
    const msg = built.errors.map((e) => e.message).join('; ')
    throw new Error(`Invalid spec.json: ${msg}`)
  }

  const requirements = parseRequirementsFile(requirementsRaw)
  if (!requirements.ok) throw new Error(requirements.message)

  const bindings = parseBindingsFile(bindingsRaw)
  if (!bindings.ok) throw new Error(bindings.message)

  const rawScreens = (specRaw as WireframeSpec).screens

  const wireframe: WireframeSpec = {
    title: built.document.title,
    screens: Object.fromEntries(
      built.document.screens.map((s) => {
        const rawScreen = rawScreens[s.id]
        return [
          s.id,
          {
            ...(rawScreen?.sr !== undefined ? { sr: rawScreen.sr } : {}),
            title: s.title,
            ...(s.note !== undefined ? { note: s.note } : {}),
            nodes: rawScreen?.nodes ?? [],
          },
        ]
      }),
    ),
  }

  return {
    storyboardDir,
    wireframe,
    requirements: requirements.value,
    bindings: bindings.value,
  }
}
