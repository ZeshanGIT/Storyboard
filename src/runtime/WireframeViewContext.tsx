import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { useWireframeErrors } from './WireframeErrorProvider'

export type WireframeView = 'preview' | 'prototype'

export type WireframeViewContextValue = {
  view: WireframeView
  navigate: (path: string) => void
  goBack: () => void
  validScreenIds: ReadonlySet<string>
  activeModalId: string | null
  openModal: (id: string) => void
  closeModal: () => void
  registerModal: (id: string) => () => void
  registeredModalIds: ReadonlySet<string>
  reportError: (message: string) => void
}

const defaultValue: WireframeViewContextValue = {
  view: 'preview',
  navigate: () => {},
  goBack: () => {},
  validScreenIds: new Set(),
  activeModalId: null,
  openModal: () => {},
  closeModal: () => {},
  registerModal: () => () => {},
  registeredModalIds: new Set(),
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
  const [activeModalId, setActiveModalId] = useState<string | null>(null)
  const [registeredModalIds, setRegisteredModalIds] = useState<Set<string>>(() => new Set())

  const openModal = useCallback((id: string) => {
    setActiveModalId(id)
  }, [])

  const closeModal = useCallback(() => {
    setActiveModalId(null)
  }, [])

  const goBack = useCallback(() => {
    window.history.back()
  }, [])

  const registerModal = useCallback((id: string) => {
    setRegisteredModalIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    return () => {
      setRegisteredModalIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [])

  const value = useMemo(
    () => ({
      view,
      navigate,
      goBack,
      validScreenIds: validIds,
      activeModalId,
      openModal,
      closeModal,
      registerModal,
      registeredModalIds,
      reportError,
    }),
    [
      view,
      navigate,
      goBack,
      validIds,
      activeModalId,
      openModal,
      closeModal,
      registerModal,
      registeredModalIds,
      reportError,
    ],
  )

  return <WireframeViewContext.Provider value={value}>{children}</WireframeViewContext.Provider>
}

export function useWireframeView(): WireframeViewContextValue {
  return useContext(WireframeViewContext)
}

export const RESERVED_GOTO = new Set(['_close', '_back'])
