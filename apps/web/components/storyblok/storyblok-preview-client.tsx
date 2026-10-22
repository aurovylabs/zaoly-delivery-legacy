'use client'

import { useEffect, useMemo, useState } from 'react'
import { CompositionPreview, type SiteKitCompositionNode } from '@zaoly/site-kit'
import {
  storyblokContentToComposition,
  type StoryblokBlokLike,
} from '../../lib/storyblok/blok-to-composition'
import { paths } from '../../lib/paths'

type Props = {
  initialStoryId: number
  initialContent: StoryblokBlokLike
  tokenPackCss: string
  storyName: string
}

declare global {
  interface Window {
    StoryblokBridge?: new (options?: Record<string, unknown>) => {
      on: (event: string, cb: (payload: { story?: { id?: number; content?: StoryblokBlokLike } }) => void) => void
    }
  }
}

export function StoryblokPreviewClient({
  initialStoryId,
  initialContent,
  tokenPackCss,
  storyName,
}: Props) {
  const [content, setContent] = useState<StoryblokBlokLike>(initialContent)

  const composition: SiteKitCompositionNode = useMemo(
    () => storyblokContentToComposition(content),
    [content],
  )

  useEffect(() => {
    const inEditor =
      typeof window !== 'undefined' &&
      window.location.search.includes('_storyblok')

    if (!inEditor) return

    const script = document.createElement('script')
    script.src = paths.storyblokBridgeScriptUrl
    script.async = true
    script.onload = () => {
      if (!window.StoryblokBridge) return
      const bridge = new window.StoryblokBridge({ preventClicks: true })
      bridge.on('input', (payload) => {
        const next = payload?.story?.content
        if (next && typeof next === 'object') {
          setContent(next)
        }
      })
      void initialStoryId
    }
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [initialStoryId])

  return (
    <div data-testid="storyblok-preview-root" data-story-name={storyName}>
      {tokenPackCss ? (
        <style data-testid="storyblok-preview-token-pack-css">{tokenPackCss}</style>
      ) : null}
      <div
        data-testid="storyblok-preview-canvas"
        style={{
          minHeight: '100vh',
          margin: 0,
          padding: 0,
          background: 'var(--ds-color-surface-canvas, var(--site-paper, #fafafa))',
          color: 'var(--ds-color-ink-primary, var(--site-ink, #111))',
        }}
      >
        <CompositionPreview node={composition} />
      </div>
    </div>
  )
}
