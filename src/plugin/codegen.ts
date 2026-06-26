import { extractScreens } from './extract-screens'
import { generateWireframeFiles } from './generate'
import type { CodegenError, ExtractedScreen } from './types'

export type RunCodegenResult =
  | { ok: true; screens: ExtractedScreen[] }
  | { ok: false; errors: CodegenError[] }

export async function runCodegen(source: string, outDir: string): Promise<RunCodegenResult> {
  const extracted = extractScreens(source)
  if (!extracted.ok) {
    return extracted
  }
  await generateWireframeFiles(extracted.screens, outDir)
  return extracted
}
