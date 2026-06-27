import type { ComponentType } from 'react'
import { WireframeViewProvider } from '../runtime/WireframeViewContext'

export type PreviewViewProps = {
  validScreenIds: readonly string[]
  document: ComponentType
}

export function PreviewView({ validScreenIds, document: Document }: PreviewViewProps) {
  return (
    <WireframeViewProvider view="preview" navigate={() => {}} validScreenIds={validScreenIds}>
      <div className="flex flex-col gap-8">
        <Document />
      </div>
    </WireframeViewProvider>
  )
}
