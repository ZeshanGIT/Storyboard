import { Command } from 'commander'
import { runDev } from './commands/dev.js'
import { runImpact } from './commands/impact.js'
import { type InitTemplate, runInit } from './commands/init.js'
import { runReqShow } from './commands/req.js'
import { runTrace } from './commands/trace.js'
import { runValidate } from './commands/validate.js'

export function buildCli(): Command {
  const program = new Command()
    .name('onespec')
    .description('Storyboard wireframe + product spec tooling')
    .version('0.1.0')

  program
    .command('init')
    .description('Scaffold storyboard/ and sample content')
    .option('--template <mode>', 'embedded or cloud', 'embedded')
    .action(async (opts: { template: string }) => {
      const template: InitTemplate = opts.template === 'cloud' ? 'cloud' : 'embedded'
      await runInit({ cwd: process.cwd(), template })
    })

  program
    .command('validate')
    .description('Validate storyboard/ JSON cross-references')
    .action(async () => {
      const code = await runValidate({ cwd: process.cwd() })
      process.exitCode = code
    })

  const req = program.command('req').description('Requirement lookups')
  req
    .command('show <id>')
    .description('Show a structural or behavioral requirement')
    .action(async (id: string) => {
      process.exitCode = await runReqShow({ cwd: process.cwd(), id })
    })

  program
    .command('impact <target>')
    .description('List screens and SRs bound to a requirement')
    .action(async (target: string) => {
      process.exitCode = await runImpact({ cwd: process.cwd(), target })
    })

  program
    .command('trace <target>')
    .description('Search implementation for requirement references')
    .action(async (target: string) => {
      process.exitCode = await runTrace({ cwd: process.cwd(), target })
    })

  program
    .command('dev')
    .description('Start Storyboard preview dev server')
    .option('-p, --port <number>', 'dev server port', '5173')
    .action(async (opts: { port: string }) => {
      const code = await runDev({ cwd: process.cwd(), port: Number(opts.port) })
      process.exitCode = code
    })

  return program
}
