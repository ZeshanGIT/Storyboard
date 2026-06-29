import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const MIN_EDITOR_WIDTH = 280
const MIN_PANEL_WIDTH = 360
const DEFAULT_EDITOR_WIDTH = 420

export type PlaygroundSplitLayoutProps = {
  editor: ReactNode
  panel: ReactNode
  defaultEditorWidth?: number
}

export function PlaygroundSplitLayout({
  editor,
  panel,
  defaultEditorWidth = DEFAULT_EDITOR_WIDTH,
}: PlaygroundSplitLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [editorWidth, setEditorWidth] = useState(defaultEditorWidth)
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null)

  const clampWidth = useCallback((next: number) => {
    const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth
    const maxEditor = Math.max(MIN_EDITOR_WIDTH, containerWidth - MIN_PANEL_WIDTH)
    return Math.min(Math.max(next, MIN_EDITOR_WIDTH), maxEditor)
  }, [])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!dragState.current) return
      const delta = event.clientX - dragState.current.startX
      setEditorWidth(clampWidth(dragState.current.startWidth + delta))
    }

    const onPointerUp = () => {
      dragState.current = null
      setIsDragging(false)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [clampWidth])

  return (
    <div ref={containerRef} className="flex h-screen w-full overflow-hidden">
      <div className="h-full shrink-0 overflow-hidden" style={{ width: editorWidth }}>
        {editor}
      </div>
      <button
        type="button"
        aria-label="Resize editor"
        className={cn(
          'w-1 shrink-0 cursor-col-resize border-0 bg-border p-0 hover:bg-primary/40',
          isDragging ? 'bg-primary/40' : '',
        )}
        onPointerDown={(event) => {
          dragState.current = { startX: event.clientX, startWidth: editorWidth }
          setIsDragging(true)
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
      />
      <div className="min-w-0 flex-1 overflow-hidden">{panel}</div>
    </div>
  )
}
