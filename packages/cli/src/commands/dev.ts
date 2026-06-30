import { resolveProjectPaths } from '../resolve-project.js'

export async function runDev(opts: { cwd: string; port?: number }): Promise<number> {
  resolveProjectPaths(opts.cwd)
  const shellVite = '@onespec-dev/shell/vite'
  const { createStoryboardDevServer } = await import(shellVite)
  const server = await createStoryboardDevServer({
    root: opts.cwd,
    port: opts.port ?? 5173,
  })
  await server.listen()
  server.printUrls()
  return 0
}
