import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { wireframeAffordanceClass } from './affordances'
import { type NoteProps, WireframeNote } from './note'

export type TextLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'body'

export type TextProps = NoteProps & {
  h1?: boolean
  h2?: boolean
  h3?: boolean
  h4?: boolean
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}

const levelTag = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'div',
} as const

const levelClass: Record<TextLevel, string> = {
  h1: 'text-2xl font-semibold tracking-tight',
  h2: 'text-xl font-semibold tracking-tight',
  h3: 'text-lg font-medium',
  h4: 'text-base font-medium',
  body: 'text-sm text-muted-foreground',
}

function resolveLevel(h1?: boolean, h2?: boolean, h3?: boolean, h4?: boolean): TextLevel {
  if (h1) return 'h1'
  if (h2) return 'h2'
  if (h3) return 'h3'
  if (h4) return 'h4'
  return 'body'
}

export function Text({ h1, h2, h3, h4, disabled, danger, note, children }: TextProps) {
  const level = resolveLevel(h1, h2, h3, h4)
  const Tag = levelTag[level]
  return (
    <WireframeNote note={note} className="w-fit self-start">
      <Tag className={cn(levelClass[level], wireframeAffordanceClass(disabled, danger))}>
        {children}
      </Tag>
    </WireframeNote>
  )
}
