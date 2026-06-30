import { Command } from 'commander'
import { type InitTemplate, runInit } from './commands/init.js'
import { runValidate } from './commands/validate.js'

export function buildCli(): Command {
  const program = new Command()
    .name('storyboard')
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

  return program
}
