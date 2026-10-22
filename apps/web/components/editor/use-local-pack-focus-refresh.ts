'use client'

import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { paths } from '../../lib/paths'
import {
  INSPECT_TOKEN_CATALOG,
  editorPackFromLocalApi,
  mergeLivePackIntoCatalog,
  type BrandTokenPackResponse,
  type InspectTokenOption,
  type ZaolyPackLeaf,
} from '../../lib/inspect/token-catalog'

type LocalPackBody = {
  tokens?: ZaolyPackLeaf[]
  origins?: Record<string, string>
  canWrite?: boolean
}

/** Refresh bound canvas values when returning from the standalone Token Studio. */
export function useLocalPackFocusRefresh(
  enabled: boolean,
  setCatalog: Dispatch<SetStateAction<InspectTokenOption[]>>,
  setPack?: Dispatch<SetStateAction<BrandTokenPackResponse | null>>,
) {
  useEffect(() => {
    if (!enabled) return
    let active = true
    let requestId = 0

    const refresh = () => {
      const currentRequest = ++requestId
      void fetch(paths.routes.apiTokens, { cache: 'no-store' })
        .then(async (res) => {
          if (!res.ok) return null
          return (await res.json()) as LocalPackBody
        })
        .then((pack) => {
          if (!active || currentRequest !== requestId || !pack) return
          setCatalog(
            pack.tokens?.length
              ? mergeLivePackIntoCatalog(pack.tokens)
              : INSPECT_TOKEN_CATALOG,
          )
          setPack?.(editorPackFromLocalApi(pack))
        })
        .catch(() => {
          // Keep the last usable catalog on a transient refresh failure.
        })
    }
    const refreshWhenVisible = () => {
      if (!document.hidden) refresh()
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [enabled, setCatalog, setPack])
}
