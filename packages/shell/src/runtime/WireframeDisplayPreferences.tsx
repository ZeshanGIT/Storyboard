import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'

export type WireframeDisplayPreferencesValue = {
  showLinkIndicators: boolean
  showNoteIndicators: boolean
  setShowLinkIndicators: (value: boolean) => void
  setShowNoteIndicators: (value: boolean) => void
}

const defaultValue: WireframeDisplayPreferencesValue = {
  showLinkIndicators: true,
  showNoteIndicators: true,
  setShowLinkIndicators: () => {},
  setShowNoteIndicators: () => {},
}

const WireframeDisplayPreferencesContext =
  createContext<WireframeDisplayPreferencesValue>(defaultValue)

export type WireframeDisplayPreferencesProviderProps = {
  children: ReactNode
}

export function WireframeDisplayPreferencesProvider({
  children,
}: WireframeDisplayPreferencesProviderProps) {
  const [showLinkIndicators, setShowLinkIndicators] = useState(true)
  const [showNoteIndicators, setShowNoteIndicators] = useState(true)

  const value = useMemo(
    () => ({
      showLinkIndicators,
      showNoteIndicators,
      setShowLinkIndicators,
      setShowNoteIndicators,
    }),
    [showLinkIndicators, showNoteIndicators],
  )

  return (
    <WireframeDisplayPreferencesContext.Provider value={value}>
      {children}
    </WireframeDisplayPreferencesContext.Provider>
  )
}

export function useWireframeDisplayPreferences(): WireframeDisplayPreferencesValue {
  return useContext(WireframeDisplayPreferencesContext)
}
