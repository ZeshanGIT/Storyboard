import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { wireframeAffordanceClass } from './affordances'

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body'

export type TextProps = {
  variant?: TextVariant
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}

const variantTag = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'p',
} as const

const variantClass: Record<TextVariant, string> = {
  h1: 'text-2xl font-semibold tracking-tight',
  h2: 'text-xl font-semibold tracking-tight',
  h3: 'text-lg font-medium',
  h4: 'text-base font-medium',
  body: 'text-sm text-muted-foreground',
}

export function Text({ variant = 'body', disabled, danger, children }: TextProps) {
  const Tag = variantTag[variant]
  return (
    <Tag className={cn(variantClass[variant], wireframeAffordanceClass(disabled, danger))}>
      {children}
    </Tag>
  )
}
