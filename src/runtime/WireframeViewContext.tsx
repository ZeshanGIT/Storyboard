import { createContext, type ReactNode, useContext } from 'react'

export type WireframeView = 'preview' | 'prototype'

export type WireframeViewContextValue = {
  view: WireframeView
  navigate: (path: string) => void
}

const defaultValue: WireframeViewContextValue = {
  view: 'preview',
  navigate: () => {},
}

const WireframeViewContext = createContext<WireframeViewContextValue>(defaultValue)

export type WireframeViewProviderProps = {
  view: WireframeView
  navigate: (path: string) => void
  children: ReactNode
}

export function WireframeViewProvider({ view, navigate, children }: WireframeViewProviderProps) {
  return (
    <WireframeViewContext.Provider value={{ view, navigate }}>
      {children}
    </WireframeViewContext.Provider>
  )
}

export function useWireframeView(): WireframeViewContextValue {
  return useContext(WireframeViewContext)
}
