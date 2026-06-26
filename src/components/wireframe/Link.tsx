import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useScreenId } from '@/components/wireframe/ScreenContext'
import { useWireframeView } from '@/runtime/WireframeViewContext'

export type LinkProps = {
  goto?: string
  children: ReactNode
}

function linkLabel(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  return 'link'
}

function formatRuntimeGotoError(
  screenId: string | undefined,
  label: string,
  goto: string | undefined,
  validScreenIds: ReadonlySet<string>,
): string {
  const knownIds = [...validScreenIds].join(', ')
  const where = screenId ? `in screen "${screenId}" on link "${label}"` : `on link "${label}"`

  if (goto === undefined) {
    return `Invalid goto ${where} — Screens.* reference is undefined (check spelling against generated Screens map; known screen ids: ${knownIds})`
  }

  if (goto.length === 0) {
    return `Invalid goto ${where} — goto is empty (known screen ids: ${knownIds})`
  }

  return `Invalid goto ${where} — "${goto}" is not a known screen id (known screen ids: ${knownIds})`
}

function isValidGoto(goto: string | undefined, validScreenIds: ReadonlySet<string>): boolean {
  return typeof goto === 'string' && goto.length > 0 && validScreenIds.has(goto)
}

export function Link({ goto, children }: LinkProps) {
  const screenId = useScreenId()
  const { view, navigate, validScreenIds, reportError } = useWireframeView()
  const valid = isValidGoto(goto, validScreenIds)
  const label = linkLabel(children)

  useEffect(() => {
    if (valid || view === 'preview') return
    reportError(formatRuntimeGotoError(screenId, label, goto, validScreenIds))
  }, [goto, valid, view, reportError, screenId, label, validScreenIds])

  if (!valid) {
    return <Badge variant="destructive">{children}</Badge>
  }

  if (view === 'preview') {
    return (
      <a href={`#${goto}`} className="text-primary underline-offset-4 hover:underline">
        {children}
      </a>
    )
  }

  return (
    <Button variant="link" className="h-auto p-0" onClick={() => navigate(`/${goto}`)}>
      {children}
    </Button>
  )
}
