import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useScreenId } from '@/components/wireframe/ScreenContext'
import { cn } from '@/lib/utils'
import { useWireframeDisplayPreferences } from '@/runtime/WireframeDisplayPreferences'
import { RESERVED_GOTO, useWireframeView } from '@/runtime/WireframeViewContext'
import type { GotoTarget } from '@/types/goto'
import { type NoteProps, WireframeNote } from './note'

export type LinkProps = NoteProps & {
  goto?: GotoTarget
  'graph-link-id'?: string
  'primary-btn'?: boolean
  'secondary-btn'?: boolean
  disabled?: boolean
  danger?: boolean
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
  knownTargets: readonly string[],
): string {
  const known = knownTargets.join(', ')
  const where = screenId ? `in screen "${screenId}" on link "${label}"` : `on link "${label}"`

  if (goto === undefined) {
    return `Invalid goto ${where} — goto is undefined (known targets: ${known})`
  }

  if (goto.length === 0) {
    return `Invalid goto ${where} — goto is empty (known targets: ${known})`
  }

  return `Invalid goto ${where} — "${goto}" is not a known target (known targets: ${known})`
}

function isValidGoto(
  goto: string | undefined,
  validScreenIds: ReadonlySet<string>,
  screenModalIds: ReadonlySet<string>,
): boolean {
  if (typeof goto !== 'string' || goto.length === 0) return false
  if (RESERVED_GOTO.has(goto)) return true
  return validScreenIds.has(goto) || screenModalIds.has(goto)
}

const linkAffordanceClass = 'inline-flex w-fit self-start border border-blue-400 px-1.5 py-0.5'

function buttonVariant(
  primaryBtn: boolean,
  secondaryBtn: boolean,
  danger?: boolean,
): 'default' | 'outline' | 'destructive' | 'link' {
  if (primaryBtn) return danger ? 'destructive' : 'default'
  if (secondaryBtn) return 'outline'
  return 'link'
}

export function Link({
  goto,
  children,
  disabled,
  danger,
  note,
  'graph-link-id': graphLinkId,
  'primary-btn': primaryBtn,
  'secondary-btn': secondaryBtn,
}: LinkProps) {
  const screenId = useScreenId()
  const {
    view,
    navigate,
    goBack,
    openModal,
    closeModal,
    validScreenIds,
    modalIdsByScreen,
    reportError,
    onGraphLinkHover,
    onGraphLinkFocus,
  } = useWireframeView()
  const { showLinkIndicators } = useWireframeDisplayPreferences()
  const linkClass = showLinkIndicators ? linkAffordanceClass : 'inline-flex w-fit self-start'

  const screenModalIds = useMemo(() => {
    const ids = screenId ? modalIdsByScreen.get(screenId) : undefined
    return new Set(ids ?? [])
  }, [screenId, modalIdsByScreen])

  const valid = isValidGoto(goto, validScreenIds, screenModalIds)
  const label = linkLabel(children)
  const knownTargets = useMemo(
    () => [...RESERVED_GOTO, ...validScreenIds, ...screenModalIds],
    [validScreenIds, screenModalIds],
  )

  useEffect(() => {
    if (valid || view === 'preview' || view === 'graph') return
    reportError(formatRuntimeGotoError(screenId, label, goto, knownTargets))
  }, [goto, valid, view, reportError, screenId, label, knownTargets])

  const handleClick = (event: MouseEvent) => {
    if (disabled || !goto) return

    if (view === 'graph') {
      event.stopPropagation()
      if (!graphLinkId || RESERVED_GOTO.has(goto) || screenModalIds.has(goto)) return
      if (validScreenIds.has(goto)) {
        onGraphLinkFocus(graphLinkId, goto)
      }
      return
    }

    if (goto === '_close') {
      closeModal()
      return
    }
    if (goto === '_back') {
      goBack()
      return
    }
    if (screenModalIds.has(goto)) {
      openModal(goto)
      return
    }
    navigate(`/${goto}`)
  }

  if (!valid) {
    return (
      <WireframeNote note={note} className="w-fit self-start">
        <span className={linkClass}>
          <Badge variant="destructive">{children}</Badge>
        </span>
      </WireframeNote>
    )
  }

  if (view === 'preview') {
    const href = goto === '_close' || goto === '_back' ? '#' : goto ? `#${goto}` : '#'
    return (
      <WireframeNote note={note} className="w-fit self-start">
        <a href={href} className={cn(linkClass, 'text-primary underline-offset-4 hover:underline')}>
          {children}
        </a>
      </WireframeNote>
    )
  }

  const isButton = Boolean(primaryBtn || secondaryBtn)
  const variant = buttonVariant(Boolean(primaryBtn), Boolean(secondaryBtn), danger)
  const graphAttrs =
    view === 'graph' && graphLinkId
      ? {
          'data-graph-link-id': graphLinkId,
          tabIndex: -1 as const,
          onMouseEnter: () => onGraphLinkHover(graphLinkId),
          onMouseLeave: () => onGraphLinkHover(null),
          onFocus: () => onGraphLinkHover(graphLinkId),
          onBlur: () => onGraphLinkHover(null),
          className: cn(
            validScreenIds.has(goto ?? '') && !screenModalIds.has(goto ?? '')
              ? 'cursor-pointer'
              : 'cursor-default',
          ),
        }
      : undefined

  if (!isButton) {
    const graphLinkClass =
      view === 'graph'
        ? 'text-left text-primary no-underline hover:no-underline'
        : 'text-left text-primary underline-offset-4 hover:underline'
    return (
      <WireframeNote note={note} className="w-fit self-start">
        <button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          {...graphAttrs}
          className={cn(
            linkClass,
            graphLinkClass,
            'disabled:pointer-events-none disabled:opacity-50',
            danger && 'text-destructive',
            graphAttrs?.className,
          )}
        >
          {children}
        </button>
      </WireframeNote>
    )
  }

  return (
    <WireframeNote note={note} className="w-fit self-start">
      <Button
        type="button"
        variant={variant}
        disabled={disabled}
        onClick={handleClick}
        {...graphAttrs}
        className={cn(
          'w-fit self-start',
          danger && !primaryBtn && 'text-destructive',
          graphAttrs?.className,
        )}
      >
        {children}
      </Button>
    </WireframeNote>
  )
}
