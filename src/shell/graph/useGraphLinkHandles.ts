import { useNodeId, useUpdateNodeInternals } from '@xyflow/react'
import { type RefObject, useCallback, useEffect, useState } from 'react'

export type GraphLinkHandlePosition = {
  x: number
  y: number
}

export function useGraphLinkHandles(
  containerRef: RefObject<HTMLDivElement | null>,
  linkIds: readonly string[],
): Map<string, GraphLinkHandlePosition> {
  const nodeId = useNodeId()
  const updateNodeInternals = useUpdateNodeInternals()
  const [handles, setHandles] = useState<Map<string, GraphLinkHandlePosition>>(() => new Map())

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const allowed = new Set(linkIds)
    const next = new Map<string, GraphLinkHandlePosition>()

    for (const element of container.querySelectorAll('[data-graph-link-id]')) {
      const linkId = element.getAttribute('data-graph-link-id')
      if (!linkId || !allowed.has(linkId)) continue

      const rect = element.getBoundingClientRect()
      next.set(linkId, {
        x: rect.right - containerRect.left,
        y: rect.top - containerRect.top + rect.height / 2,
      })
    }

    setHandles(next)
    if (nodeId) {
      updateNodeInternals(nodeId)
    }
  }, [containerRef, linkIds, nodeId, updateNodeInternals])

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
