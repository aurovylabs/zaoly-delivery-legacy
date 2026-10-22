'use client'

/**
 * Wave H — paint/write OP-9 primary without threading every SceneNodeView call.
 */
import { createContext, useContext, type ReactNode } from 'react'
import type { DigitalPrimaryBreakpoint } from './cascade'

const PrimaryBreakpointContext = createContext<DigitalPrimaryBreakpoint>('desktop')

export function PrimaryBreakpointProvider({
  primary,
  children,
}: {
  primary: DigitalPrimaryBreakpoint
  children: ReactNode
}) {
  return (
    <PrimaryBreakpointContext.Provider value={primary}>
      {children}
    </PrimaryBreakpointContext.Provider>
  )
}

export function usePrimaryBreakpoint(): DigitalPrimaryBreakpoint {
  return useContext(PrimaryBreakpointContext)
}
