'use client'

import dynamic from 'next/dynamic'
import type { InspectorDesignTabProps } from './inspector-design-tab'

export const InspectorDesignTabLazy = dynamic<InspectorDesignTabProps>(
  () => import('./inspector-design-tab').then((m) => ({ default: m.InspectorDesignTab })),
  { ssr: false },
)
