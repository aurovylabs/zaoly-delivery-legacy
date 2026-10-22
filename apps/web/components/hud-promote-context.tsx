'use client'

/**
 * Smart HUD → local pack promote (same dialog/API as Inspect).
 * Knowledge: `knowledge/hud-tokenpicker.md` · `knowledge/zaoly-token-studio.md`
 */
import React, { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useT } from '../lib/user-prefs'
import { useInspectTokenCatalog } from '../lib/inspect/token-catalog-context'
import type { BrandTokenPackResponse, ZaolyPackLeaf } from '../lib/inspect/token-catalog'
import {
  isPromotableLiteral,
  studioTypeForInspectGroup,
} from '../lib/inspect/digital-edit'
import { isBrandPackPromoteWritable } from '../lib/inspect/brand-pack-writable'
import type { HudTokenGroup } from './hud-token-field'
import { useInspectorPromote } from './editor-inspector/use-inspector-promote'
import { InspectorPromoteDialog } from './editor-inspector/inspector-promote-dialog'
import { buildHudTokenWriteOps } from '../lib/inspect/resolve-hud-model'
import type { SceneNode, SceneOp } from '@zaoly/contracts'

export type HudPromoteApi = {
  packWritable: boolean
  /** Open promote dialog when literal is promotable for this group. */
  tryPromote: (args: {
    slotKey: string
    tokenGroup: HudTokenGroup | 'size'
    literal: string
  }) => void
  canPromote: (tokenGroup: HudTokenGroup | 'size', literal: string) => boolean
}

const HudPromoteContext = createContext<HudPromoteApi | null>(null)

export function studioTypeForHudGroup(group: HudTokenGroup | 'size'): string | null {
  if (group === 'fontSize') return 'size'
  if (group === 'size') return 'size'
  return studioTypeForInspectGroup(group)
}

export function useHudPromote(): HudPromoteApi | null {
  return useContext(HudPromoteContext)
}

export function HudPromoteProvider({
  brandPack,
  selectedNode,
  onOps,
  onTokenSaved,
  children,
}: {
  brandPack: BrandTokenPackResponse | null
  selectedNode: SceneNode | null
  onOps?: (ops: SceneOp[]) => void
  onTokenSaved?: (token: ZaolyPackLeaf) => void
  children: ReactNode
}) {
  const t = useT()
  const catalog = useInspectTokenCatalog()
  const packWritable = isBrandPackPromoteWritable(brandPack)

  const selectedRef = React.useRef(selectedNode)
  selectedRef.current = selectedNode
  const onOpsRef = React.useRef(onOps)
  onOpsRef.current = onOps

  const { openPromoteLiteral, promoteDialog } = useInspectorPromote({
    brandPack,
    catalog,
    setToken: (key, tokenPath) => {
      const node = selectedRef.current
      if (!node) return
      onOpsRef.current?.(buildHudTokenWriteOps(node, key, { kind: 'token', path: tokenPath }))
    },
    onTokenSaved,
    t,
  })

  const api = useMemo<HudPromoteApi>(
    () => ({
      packWritable,
      canPromote: (tokenGroup, literal) => {
        if (!packWritable) return false
        const studioType = studioTypeForHudGroup(tokenGroup)
        if (!studioType) return false
        return isPromotableLiteral(studioType, literal)
      },
      tryPromote: ({ slotKey, tokenGroup, literal }) => {
        if (!packWritable) return
        const studioType = studioTypeForHudGroup(tokenGroup)
        if (!studioType || !isPromotableLiteral(studioType, literal)) return
        openPromoteLiteral(slotKey, studioType, literal)
      },
    }),
    [packWritable, openPromoteLiteral],
  )

  return (
    <HudPromoteContext.Provider value={api}>
      {children}
      <InspectorPromoteDialog
        draft={promoteDialog.draft}
        path={promoteDialog.path}
        busy={promoteDialog.busy}
        error={promoteDialog.error}
        localPreview={promoteDialog.localPreview}
        onPathChange={promoteDialog.setPath}
        onClose={promoteDialog.close}
        onSubmit={promoteDialog.submit}
        t={t}
      />
    </HudPromoteContext.Provider>
  )
}
