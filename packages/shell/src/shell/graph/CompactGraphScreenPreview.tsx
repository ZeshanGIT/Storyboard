import { WireframeViewProvider } from '@shell/runtime/WireframeViewContext'
import type { ComponentType } from 'react'
import { COMPACT_PREVIEW_GAP, computeCompactPreviewDimensions } from './compact-preview-bounds'
import { ScreenGraphNodeShell } from './ScreenGraphNodeShell'
import type { MeasuredScreenNodeSize } from './screen-node-size'

export type CompactGraphScreenPreviewProps = {
  title: string
  isEntry: boolean
  component: ComponentType
  measuredSize: MeasuredScreenNodeSize
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
}

export function CompactGraphScreenPreview({
  title,
  isEntry,
  component: Screen,
  measuredSize,
  validScreenIds,
  modalIdsByScreen,
}: CompactGraphScreenPreviewProps) {
  const { width: previewWidth, height: previewHeight } =
    computeCompactPreviewDimensions(measuredSize)

  return (
    <section
      className="wireframe-graph-compact-preview pointer-events-auto absolute left-0 top-full z-50 w-max border border-border bg-background shadow-none"
      style={{ marginTop: COMPACT_PREVIEW_GAP }}
      aria-label={`${title} wireframe preview`}
    >
      <p className="border-b border-border px-2 py-1 text-xs font-medium">{title}</p>
      <div className="overflow-hidden" style={{ width: previewWidth, height: previewHeight }}>
        <div
          style={{
            width: measuredSize.width,
            height: measuredSize.height,
            transform: `scale(${previewWidth / measuredSize.width})`,
            transformOrigin: 'top left',
          }}
        >
          <ScreenGraphNodeShell
            isEntry={isEntry}
            width={measuredSize.width}
            height={measuredSize.height}
          >
            <WireframeViewProvider
              view="graph"
              navigate={() => {}}
              validScreenIds={validScreenIds}
              modalIdsByScreen={modalIdsByScreen}
            >
              <Screen />
            </WireframeViewProvider>
          </ScreenGraphNodeShell>
        </div>
      </div>
    </section>
  )
}
