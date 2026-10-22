'use client'

/**
 * Shared Inspect ↔ HUD interactive pseudo-state (default / hover / focus / active / disabled).
 * Spec: `specs/domain/canvas-smart-hud.md` W4 · Knowledge: `knowledge/canvas-smart-hud.md`
 * Starter Masters: `specs/domain/zaoly-starter-token-pack.md` interactive states.
 */
import React, { createContext, useContext, useMemo, useState } from 'react'
import type { SceneStateId } from '@zaoly/contracts'
import { SCENE_STATE_IDS } from '@zaoly/contracts'

type InteractiveStateContextValue = {
  activeState: SceneStateId
  setActiveState: (state: SceneStateId) => void
}

const InteractiveStateContext = createContext<InteractiveStateContextValue | null>(null)

export function InteractiveStateProvider({ children }: { children: React.ReactNode }) {
  const [activeState, setActiveState] = useState<SceneStateId>('default')
  const value = useMemo(() => ({ activeState, setActiveState }), [activeState])
  return (
    <InteractiveStateContext.Provider value={value}>{children}</InteractiveStateContext.Provider>
  )
}

export function useInteractiveState(): InteractiveStateContextValue {
  const ctx = useContext(InteractiveStateContext)
  if (!ctx) {
    return {
      activeState: 'default',
      setActiveState: () => undefined,
    }
  }
  return ctx
}

export function isInteractiveStateId(value: string): value is SceneStateId {
  return (SCENE_STATE_IDS as readonly string[]).includes(value)
}
