'use client'

import dynamic from 'next/dynamic'
import type { InspectorCssTabProps } from './inspector-css-tab'

export const InspectorCssTabLazy = dynamic<InspectorCssTabProps>(
  () => import('./inspector-css-tab').then((m) => ({ default: m.InspectorCssTab })),
  { ssr: false },
)
