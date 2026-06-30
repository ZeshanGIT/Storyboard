import type { LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import { wireframeAffordanceClass } from './affordances'
import { type NoteProps, WireframeNote } from './note'

export type IconSize = 'sm' | 'md' | 'lg'

export type IconProps = NoteProps & {
  name: string
  size?: IconSize
  disabled?: boolean
  danger?: boolean
}

const sizeClass: Record<IconSize, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
}

function kebabToPascal(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function resolveLucideIcon(name: string): LucideIcon | undefined {
  const key = kebabToPascal(name)
  const icons = LucideIcons as unknown as Record<string, LucideIcon | undefined>
  return icons[key]
}

export function Icon({ name, size = 'md', disabled, danger, note }: IconProps) {
  const LucideIconComponent = resolveLucideIcon(name)

  if (!LucideIconComponent) {
    return (
      <WireframeNote note={note} className="inline-flex w-fit self-start">
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-none border border-dashed border-border px-1 text-[10px] text-muted-foreground',
            sizeClass[size],
            wireframeAffordanceClass(disabled, danger),
          )}
          title={`icon:${name}`}
        >
          ?
        </span>
      </WireframeNote>
    )
  }

  return (
    <WireframeNote note={note} className="inline-flex w-fit self-start">
      <LucideIconComponent
        className={cn(sizeClass[size], wireframeAffordanceClass(disabled, danger))}
        aria-hidden
      />
    </WireframeNote>
  )
}
