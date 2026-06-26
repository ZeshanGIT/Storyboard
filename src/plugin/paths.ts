import { resolve } from 'node:path'

export const WIREFRAME_MDX = 'src/content/wireframe.mdx'
export const GENERATED_DIR = 'src/generated'

export function resolveWireframePath(root: string): string {
  return resolve(root, WIREFRAME_MDX)
}

export function resolveGeneratedDir(root: string): string {
  return resolve(root, GENERATED_DIR)
}
