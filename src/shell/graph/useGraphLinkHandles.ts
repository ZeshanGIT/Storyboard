import { useNodeId, useStore, useUpdateNodeInternals } from '@xyflow/react'
import { type RefObject, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { type GraphLinkRect, measureLinkHandlePositions } from './measure-link-handle-positions'

export function useGraphLinkHandles(
  containerRef: RefObject<HTMLDivElement | null>,
  linkIds: readonly string[],
  onMeasured?: (rects: Map<string, GraphLinkRect>) => void,
): Map<string, GraphLinkRect> {
  const nodeId = useNodeId()
  const updateNodeInternals = useUpdateNodeInternals()
  const transform = useStore((state) => state.transform)
  const [handles, setHandles] = useState<Map<string, GraphLinkRect>>(() => new Map())
  const [version, setVersion] = useState(0)

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const rects = measureLinkHandlePositions(container, linkIds)
    setHandles(rects)
    onMeasured?.(rects)
    setVersion((v) => v + 1)
  }, [containerRef, linkIds, onMeasured])

  useLayoutEffect(() => {
    measure()
    // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure on viewport zoom/pan
  }, [transform, measure])

  // Re-register handles after measure or viewport zoom/pan.
  // biome-ignore lint/correctness/useExhaustiveDependencies: version and transform are intentional triggers
  useLayoutEffect(() => {
    if (nodeId) updateNodeInternals(nodeId)
  }, [version, transform, nodeId, updateNodeInternals])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, measure])

  return handles
}
