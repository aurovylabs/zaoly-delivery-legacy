'use client'

import { useMemo, useState } from 'react'
import { paths } from '../lib/paths'

type CompositionCardPreviewProps = {
  sceneId: string
  pageId?: string | null
  compact?: boolean
  emptyLabel: string
  title: string
}

/** Scaled sandboxed iframe → scene preview-html (hub thumbnails). */
export function CompositionCardPreview({
  sceneId,
  pageId,
  compact = false,
  emptyLabel,
  title,
}: CompositionCardPreviewProps) {
  const [previewFailed, setPreviewFailed] = useState(false)
  const src = useMemo(() => {
    const q = new URLSearchParams()
    q.set('breakpoint', 'desktop')
    if (pageId?.trim()) q.set('pageId', pageId.trim())
    return `${paths.routes.apiScenePreviewHtml(sceneId)}?${q.toString()}`
  }, [pageId, sceneId])

  if (!sceneId || previewFailed) {
    return (
      <div
        className={
          compact
            ? 'creation-composition-card-preview creation-composition-card-preview--compact creation-composition-card-preview--empty'
            : 'creation-composition-card-preview creation-composition-card-preview--empty'
        }
        aria-hidden
        data-testid="composition-card-preview-empty"
      >
        {emptyLabel}
      </div>
    )
  }

  return (
    <div
      className={
        compact
          ? 'creation-composition-card-preview creation-composition-card-preview--compact'
          : 'creation-composition-card-preview'
      }
      aria-hidden
    >
      <div className="creation-composition-card-preview__scale">
        <iframe
          className="creation-composition-card-preview__frame"
          title={title}
          src={src}
          sandbox=""
          loading="lazy"
          tabIndex={-1}
          onError={() => setPreviewFailed(true)}
        />
      </div>
    </div>
  )
}
