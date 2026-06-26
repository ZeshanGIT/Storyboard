import type { ReactNode } from 'react'

export type ButtonProps = {
  type?: 'button' | 'submit'
  children: ReactNode
}

export function Button({ type = 'button', children }: ButtonProps) {
  return (
    <button type={type} className="border border-current px-2 py-1">
      {children}
    </button>
  )
}
