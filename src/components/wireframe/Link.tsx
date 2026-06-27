import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useScreenId } from '@/components/wireframe/ScreenContext'
import type { GotoTarget } from '@/generated/routes.generated'
import { cn } from '@/lib/utils'
import { RESERVED_GOTO, useWireframeView } from '@/runtime/WireframeViewContext'

export type LinkProps = {
  goto?: GotoTarget
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
  registeredModalIds: ReadonlySet<string>,
): boolean {
  if (typeof goto !== 'string' || goto.length === 0) return false
  if (RESERVED_GOTO.has(goto)) return true
  return validScreenIds.has(goto) || registeredModalIds.has(goto)
}

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
    registeredModalIds,
    reportError,
  } = useWireframeView()

  const valid = isValidGoto(goto, validScreenIds, registeredModalIds)
  const label = linkLabel(children)
  const knownTargets = useMemo(
    () => [...RESERVED_GOTO, ...validScreenIds, ...registeredModalIds],
    [validScreenIds, registeredModalIds],
  )

  useEffect(() => {
    if (valid || view === 'preview') return
    reportError(formatRuntimeGotoError(screenId, label, goto, knownTargets))
  }, [goto, valid, view, reportError, screenId, label, knownTargets])

  const handleClick = () => {
    if (disabled || !goto) return
    if (goto === '_close') {
      closeModal()
      return
    }
    if (goto === '_back') {
      goBack()
      return
    }
    if (registeredModalIds.has(goto)) {
      openModal(goto)
      return
    }
    navigate(`/${goto}`)
  }

  if (!valid) {
    return <Badge variant="destructive">{children}</Badge>
  }

  if (view === 'preview') {
    const href = goto === '_close' || goto === '_back' ? '#' : goto ? `#${goto}` : '#'
    return (
      <a href={href} className="text-primary underline-offset-4 hover:underline">
        {children}
      </a>
    )
  }

  const isButton = Boolean(primaryBtn || secondaryBtn)
  const variant = buttonVariant(Boolean(primaryBtn), Boolean(secondaryBtn), danger)

  if (!isButton) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'w-fit self-start text-left text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50',
          danger && 'text-destructive',
        )}
      >
        {children}
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled}
      className={cn('w-fit self-start', danger && !primaryBtn && 'text-destructive')}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}
