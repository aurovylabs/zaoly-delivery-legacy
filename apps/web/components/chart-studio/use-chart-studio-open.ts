'use client'

import { useEffect, useRef, useState } from 'react'
import {
  isChartStudioOpen,
  isChartStudioSubjectType,
  shouldClearChartStudioDismiss,
} from '../../lib/chart-studio/open-state'

/** Open Chart studio when a SiteChart is selected; dismiss resets on selection change. */
export function useChartStudioOpen(selectedType: string | null | undefined, selectedId: string | null) {
  const subjectIsChart = isChartStudioSubjectType(selectedType)
  const [userDismissed, setUserDismissed] = useState(false)
  const prevIdRef = useRef<string | null>(null)

  useEffect(() => {
    const nextId = subjectIsChart ? selectedId : null
    if (shouldClearChartStudioDismiss(prevIdRef.current, nextId, subjectIsChart)) {
      setUserDismissed(false)
    }
    prevIdRef.current = nextId
  }, [selectedId, subjectIsChart])

  const open = isChartStudioOpen({ subjectIsChart, userDismissed })

  return {
    open,
    subjectIsChart,
    dismiss: () => setUserDismissed(true),
    reopen: () => setUserDismissed(false),
  }
}
