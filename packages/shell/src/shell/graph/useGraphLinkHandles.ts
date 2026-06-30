import { useNodeId, useUpdateNodeInternals } from '@xyflow/react'
import { type RefObject, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  type GraphLinkRect,
  graphLinkRectsEqual,
  measureLinkHandlePositions,
} from './measure-link-handle-positions'

export function useGraphLinkHandles(
  containerRef: RefObject<HTMLDivElement | null>,
  linkIds: readonly string[],
  onMeasured?: (rects: Map<string, GraphLinkRect>) => void,
): Map<string, GraphLinkRect> {
  const nodeId = useNodeId()
  const updateNodeInternals = useUpdateNodeInternals()
  const [handles, setHandles] = useState<Map<string, GraphLinkRect>>(() => new Map())
  const [version, setVersion] = useState(0)

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const rects = measureLinkHandlePositions(container, linkIds)
    setHandles((prev) => {
      if (graphLinkRectsEqual(prev, rects)) return prev
      onMeasured?.(rects)
      setVersion((v) => v + 1)
      return rects
    })
  }, [containerRef, linkIds, onMeasured])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  // Re-register handles after link positions change (mount, resize, content).
  // biome-ignore lint/correctness/useExhaustiveDependencies: version is the intentional trigger
  useLayoutEffect(() => {
    if (nodeId) updateNodeInternals(nodeId)
  }, [version, nodeId, updateNodeInternals])

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
