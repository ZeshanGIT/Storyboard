import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { useWireframeErrors } from './WireframeErrorProvider'

export type WireframeView = 'preview' | 'prototype'

export type WireframeViewContextValue = {
  view: WireframeView
  navigate: (path: string) => void
  goBack: () => void
  validScreenIds: ReadonlySet<string>
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
  activeModalId: string | null
  openModal: (id: string) => void
  closeModal: () => void
  reportError: (message: string) => void
}

const defaultValue: WireframeViewContextValue = {
  view: 'preview',
  navigate: () => {},
  goBack: () => {},
  validScreenIds: new Set(),
  modalIdsByScreen: new Map(),
  activeModalId: null,
  openModal: () => {},
  closeModal: () => {},
  reportError: () => {},
}

const WireframeViewContext = createContext<WireframeViewContextValue>(defaultValue)

export type WireframeViewProviderProps = {
  view: WireframeView
  navigate: (path: string) => void
  validScreenIds: readonly string[]
  modalIdsByScreen: ReadonlyMap<string, readonly string[]>
  children: ReactNode
}

export function WireframeViewProvider({
  view,
  navigate,
  validScreenIds,
  modalIdsByScreen,
  children,
}: WireframeViewProviderProps) {
  const { reportError } = useWireframeErrors()
  const validIds = useMemo(() => new Set(validScreenIds), [validScreenIds])
  const [activeModalId, setActiveModalId] = useState<string | null>(null)

  const openModal = useCallback((id: string) => {
    setActiveModalId(id)
  }, [])

  const closeModal = useCallback(() => {
    setActiveModalId(null)
  }, [])

  const goBack = useCallback(() => {
    window.history.back()
  }, [])

  const value = useMemo(
    () => ({
      view,
      navigate,
      goBack,
      validScreenIds: validIds,
      modalIdsByScreen,
      activeModalId,
      openModal,
      closeModal,
      reportError,
    }),
    [
      view,
      navigate,
      goBack,
      validIds,
      modalIdsByScreen,
      activeModalId,
      openModal,
      closeModal,
      reportError,
    ],
  )

  return <WireframeViewContext.Provider value={value}>{children}</WireframeViewContext.Provider>
}

export function useWireframeView(): WireframeViewContextValue {
  return useContext(WireframeViewContext)
}

export const RESERVED_GOTO = new Set(['_close', '_back'])
