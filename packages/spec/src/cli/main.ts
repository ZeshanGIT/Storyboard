import { runImpact } from './run-impact.js'
import { runReqShow } from './run-req-show.js'
import { runTrace } from './run-trace.js'
import { runValidate } from './run-validate.js'

const [command, sub, ...rest] = process.argv.slice(2)
const cwd = process.cwd()

async function main(): Promise<number> {
  if (command === 'validate') return runValidate(cwd)
  if (command === 'req' && sub === 'show') return runReqShow(cwd, rest[0] ?? '')
  if (command === 'impact') return runImpact(cwd, sub ?? '')
  if (command === 'trace') return runTrace(cwd, sub ?? '')
  console.error(`Usage: onespec validate | req show <id> | impact <target> | trace <target>`)
  return 1
}

main().then((code) => {
  process.exitCode = code
})
