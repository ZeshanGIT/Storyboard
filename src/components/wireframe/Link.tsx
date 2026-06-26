import type { ReactNode } from 'react'
import { useWireframeView } from '../../runtime/WireframeViewContext'

export type LinkProps = {
  goto: string
  children: ReactNode
}

export function Link({ goto, children }: LinkProps) {
  const { view, navigate } = useWireframeView()

  if (view === 'preview') {
    return (
      <a href={`#${goto}`} className="underline">
        {children}
      </a>
    )
  }

  return (
    <button type="button" className="underline" onClick={() => navigate(`/${goto}`)}>
      {children}
    </button>
  )
}
