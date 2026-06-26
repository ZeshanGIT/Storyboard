import WireframeDocument from '../content/wireframe.mdx'
import { WireframeViewProvider } from '../runtime/WireframeViewContext'

export function PreviewView() {
  return (
    <WireframeViewProvider view="preview" navigate={() => {}}>
      <div className="space-y-8">
        <WireframeDocument />
      </div>
    </WireframeViewProvider>
  )
}
