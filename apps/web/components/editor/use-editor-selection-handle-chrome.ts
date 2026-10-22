'use client'

import { useEffect, useState } from 'react'
import { resolveSelectionHandleChromeVars } from '../../lib/editor/selection-handle-chrome'

/** Tracks DPR for selection handle CSS vars (P95). */
export function useEditorSelectionHandleChrome(): Record<string, string> {
  const [vars, setVars] = useState<Record<string, string>>(() =>
    resolveSelectionHandleChromeVars(
      typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    ),
  )

  useEffect(() => {
    function sync() {
      setVars(resolveSelectionHandleChromeVars(window.devicePixelRatio))
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  return vars
}
