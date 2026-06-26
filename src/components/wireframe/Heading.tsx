import type { ReactNode } from 'react'

export type HeadingProps = {
  level?: 1 | 2 | 3
  children: ReactNode
}

const headingTags = { 1: 'h1', 2: 'h2', 3: 'h3' } as const

const headingClasses = {
  1: 'text-2xl font-semibold tracking-tight',
  2: 'text-xl font-semibold tracking-tight',
  3: 'text-lg font-medium',
} as const

export function Heading({ level = 2, children }: HeadingProps) {
  const Tag = headingTags[level]
  return <Tag className={headingClasses[level]}>{children}</Tag>
}
