import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'

const ScreenContext = createContext<string | undefined>(undefined)

export function ScreenProvider({ screenId, children }: { screenId: string; children: ReactNode }) {
  return <ScreenContext.Provider value={screenId}>{children}</ScreenContext.Provider>
}

export function useScreenId(): string | undefined {
  return useContext(ScreenContext)
}
