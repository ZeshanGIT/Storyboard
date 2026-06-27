import WireframeDocument from '../content/wireframe.mdx'
import { WireframeViewProvider } from '../runtime/WireframeViewContext'

export type PreviewViewProps = {
  validScreenIds: readonly string[]
}

export function PreviewView({ validScreenIds }: PreviewViewProps) {
  return (
    <WireframeViewProvider view="preview" navigate={() => {}} validScreenIds={validScreenIds}>
      <div className="flex flex-col gap-8">
        <WireframeDocument />
      </div>
    </WireframeViewProvider>
  )
}
