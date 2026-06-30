import { Shell } from '../src/shell/Shell'
import { resolveOnespecDir } from '../src/vite/detect-mode'
import { loadJsonDocumentBundle } from '../src/vite/json-content-loader'

const onespecDir = resolveOnespecDir(import.meta.env.ONESPEC_ROOT ?? process.cwd())
const documents = [loadJsonDocumentBundle(onespecDir)]

export function OnespecApp() {
  return <Shell documents={documents} appDefaults={{ app: 'mdx' }} />
}
