import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { useWireframeErrors } from './WireframeErrorProvider'

export type WireframeView = 'preview' | 'prototype'

export type WireframeViewContextValue = {
  view: WireframeView
  navigate: (path: string) => void
  validScreenIds: ReadonlySet<string>
  reportError: (message: string) => void
}

const defaultValue: WireframeViewContextValue = {
  view: 'preview',
  navigate: () => {},
  validScreenIds: new Set(),
  reportError: () => {},
}

const WireframeViewContext = createContext<WireframeViewContextValue>(defaultValue)

export type WireframeViewProviderProps = {
  view: WireframeView
  navigate: (path: string) => void
  validScreenIds: readonly string[]
  children: ReactNode
}

export function WireframeViewProvider({
  view,
  navigate,
  validScreenIds,
  children,
}: WireframeViewProviderProps) {
  const { reportError } = useWireframeErrors()
  const validIds = useMemo(() => new Set(validScreenIds), [validScreenIds])

  const value = useMemo(
    () => ({ view, navigate, validScreenIds: validIds, reportError }),
    [view, navigate, validIds, reportError],
  )

  return <WireframeViewContext.Provider value={value}>{children}</WireframeViewContext.Provider>
}

export function useWireframeView(): WireframeViewContextValue {
  return useContext(WireframeViewContext)
}
