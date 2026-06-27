import { runFullCodegen } from './run-full-codegen'

const root = process.cwd()

const result = await runFullCodegen(root)
if (!result.ok) {
  for (const error of result.errors) {
    console.error(`[wireframe] Codegen failed: ${error.message}`)
  }
  process.exit(1)
}

console.log(`[wireframe] Generated ${result.screens.length} screen(s)`)
