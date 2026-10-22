'use client'

import { useEffect, useState } from 'react'
import { CompositionPreview, type SiteKitCompositionNode } from '@zaoly/site-kit'
import { siteKitAtomPreviewNode } from '../lib/library/site-kit-atom-preview-nodes'
import { starterSectionPreviewNode } from '../lib/site-kit/zaoly-starter-sections'

type SiteKitLibraryPreviewProps =
  | { kind: 'atom'; atomId: string }
  | {
      kind: 'composition'
      componentId: string
      node: SiteKitCompositionNode | null | undefined
    }
  | { kind: 'section'; componentId: string }

/** Non-interactive Site Kit preview tile for Library catalog cards. */
export function SiteKitLibraryPreview(props: SiteKitLibraryPreviewProps) {
  const variant = props.kind
  const testId =
    props.kind === 'atom'
      ? `library-atom-preview-${props.atomId}`
      : props.kind === 'section'
        ? `library-section-preview-${props.componentId}`
        : `library-composition-preview-${props.componentId}`

  // Section seeds mint scene ids via Date.now() — defer so /library Cache Components prerender stays pure.
  const sectionComponentId = props.kind === 'section' ? props.componentId : null
  const [sectionNode, setSectionNode] = useState<SiteKitCompositionNode | null>(null)
  useEffect(() => {
    if (!sectionComponentId) {
      setSectionNode(null)
      return
    }
    setSectionNode(starterSectionPreviewNode(sectionComponentId))
  }, [sectionComponentId])

  const node =
    props.kind === 'atom'
      ? siteKitAtomPreviewNode(props.atomId)
      : props.kind === 'section'
        ? sectionNode
        : (props.node ?? null)

  if (!node) {
    if (props.kind === 'composition' || props.kind === 'section') {
      return (
        <div
          className={`creation-library-kit-preview creation-library-kit-preview--${variant} creation-library-kit-preview--empty`}
          data-testid={testId}
          aria-hidden
        />
      )
    }
    return null
  }

  return (
    <div
      className={`creation-library-kit-preview creation-library-kit-preview--${variant}`}
      data-testid={testId}
      aria-hidden
    >
      <div className="creation-library-kit-preview__canvas">
        <CompositionPreview node={node} />
      </div>
    </div>
  )
}
