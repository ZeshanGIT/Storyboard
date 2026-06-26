import type { ReactNode } from 'react'
import { Button as ShadcnButton } from '@/components/ui/button'

export type ButtonProps = {
  type?: 'button' | 'submit'
  children: ReactNode
}

export function Button({ type = 'button', children }: ButtonProps) {
  return <ShadcnButton type={type}>{children}</ShadcnButton>
}
