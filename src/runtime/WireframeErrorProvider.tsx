import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { WireframeErrorOverlay } from './WireframeErrorOverlay'

type WireframeErrorContextValue = {
  reportError: (message: string) => void
}

const WireframeErrorContext = createContext<WireframeErrorContextValue | null>(null)

export type WireframeErrorProviderProps = {
  initialErrors?: readonly string[]
  children: ReactNode
}

export function WireframeErrorProvider({
  initialErrors = [],
  children,
}: WireframeErrorProviderProps) {
  const [runtimeErrors, setRuntimeErrors] = useState<string[]>([])

  const reportError = useCallback((message: string) => {
    setRuntimeErrors((prev) => (prev.includes(message) ? prev : [...prev, message]))
    console.error(`[wireframe] ${message}`)
  }, [])

  const errors = useMemo(() => {
    const merged = [...initialErrors, ...runtimeErrors]
    return [...new Set(merged)]
  }, [initialErrors, runtimeErrors])

  const value = useMemo(() => ({ reportError }), [reportError])

  return (
    <WireframeErrorContext.Provider value={value}>
      {children}
      <WireframeErrorOverlay errors={errors} />
    </WireframeErrorContext.Provider>
  )
}

export function useWireframeErrors(): WireframeErrorContextValue {
  const context = useContext(WireframeErrorContext)
  if (!context) {
    throw new Error('useWireframeErrors must be used within WireframeErrorProvider')
  }
  return context
}
