'use client'

import type { ReactNode } from 'react'

/** Vitest stub for react-driftkit SnapDock. */
export function SnapDock({ children }: { children?: ReactNode }) {
  return <div data-testid="snap-dock-mock">{children}</div>
}

export default SnapDock
