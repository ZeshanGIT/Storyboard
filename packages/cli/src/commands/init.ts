import { access, cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export type InitTemplate = 'embedded' | 'cloud'

const templatesRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../templates')

export async function runInit(opts: { cwd: string; template: InitTemplate }): Promise<void> {
  const dest = opts.template === 'cloud' ? join(opts.cwd, 'todo-poc') : opts.cwd
  const src = join(templatesRoot, opts.template)

  try {
    await access(join(dest, 'storyboard', 'spec.json'))
    throw new Error('storyboard/ already exists — aborting init')
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
  }

  await mkdir(dest, { recursive: true })
  await cp(src, dest, { recursive: true })
  console.log(`Initialized ${opts.template} storyboard at ${dest}`)
}
