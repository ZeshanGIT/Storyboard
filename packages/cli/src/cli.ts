import { Command } from 'commander'
import { runValidate } from './commands/validate.js'

export function buildCli(): Command {
  const program = new Command()
    .name('storyboard')
    .description('Storyboard wireframe + product spec tooling')
    .version('0.1.0')

  program
    .command('validate')
    .description('Validate storyboard/ JSON cross-references')
    .action(async () => {
      const code = await runValidate({ cwd: process.cwd() })
      process.exitCode = code
    })

  return program
}
