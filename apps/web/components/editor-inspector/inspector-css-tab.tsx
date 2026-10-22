'use client'

import type { Translator } from '../../lib/i18n'
import { useState } from 'react'
import type { SceneNode } from '@zaoly/contracts'
import { InspectorCssPanel } from './inspector-css-panel'
import { peekResolvedCss } from '../../lib/inspect/css-peek'
import { cascadeNodeForBreakpoint } from '../../lib/scene/cascade'
import type { useInspectTokenCatalog } from '../../lib/inspect/token-catalog-context'

export type InspectorCssTabProps = {
  selected: SceneNode
  cascaded: ReturnType<typeof cascadeNodeForBreakpoint>
  catalog: ReturnType<typeof useInspectTokenCatalog>
  t: Translator
}

export function InspectorCssTab({ selected, cascaded, catalog, t }: InspectorCssTabProps) {
  const cssPeek = peekResolvedCss(
    {
      ...selected,
      props: cascaded.props,
      tokenBindings: cascaded.tokenBindings,
    },
    catalog,
  )
  const [cssCopied, setCssCopied] = useState(false)
  const cssPeekText = (() => {
    const lines: string[] = []
    for (const row of cssPeek.styles) lines.push(`${row.key}: ${row.value};`)
    for (const row of cssPeek.attrs) lines.push(`${row.key}: ${row.value};`)
    return lines.join('\n')
  })()

  function copyCssPeek() {
    if (!cssPeekText) return
    void navigator.clipboard?.writeText?.(cssPeekText).then(() => {
      setCssCopied(true)
      window.setTimeout(() => setCssCopied(false), 1500)
    })
  }

  return (
    <InspectorCssPanel
      cssPeek={cssPeek}
      cssCopied={cssCopied}
      onCopy={copyCssPeek}
      t={t}
    />
  )
}
