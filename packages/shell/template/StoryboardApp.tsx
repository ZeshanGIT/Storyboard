import { Shell } from '../src/shell/Shell'
import { resolveStoryboardDir } from '../src/vite/detect-mode'
import { loadJsonDocumentBundle } from '../src/vite/json-content-loader'

const storyboardDir = resolveStoryboardDir(import.meta.env.STORYBOARD_ROOT ?? process.cwd())
const documents = [loadJsonDocumentBundle(storyboardDir)]

export function StoryboardApp() {
  return <Shell documents={documents} appDefaults={{ app: 'mdx' }} />
}
