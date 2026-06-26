import type { ReactNode } from 'react'

type MdxButtonProps = {
  children: ReactNode
}

export function MdxButton({ children }: MdxButtonProps) {
  return (
    <button
      type="button"
      className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500"
    >
      {children}
    </button>
  )
}
