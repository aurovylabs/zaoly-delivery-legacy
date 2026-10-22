'use client'

import React from 'react'
import { InspectorDesignTab } from '../../components/editor-inspector/inspector-design-tab'
import { InspectorCssTab } from '../../components/editor-inspector/inspector-css-tab'
import type { InspectorDesignTabProps } from '../../components/editor-inspector/inspector-design-tab'
import type { InspectorCssTabProps } from '../../components/editor-inspector/inspector-css-tab'

type DynamicOptions = {
  ssr?: boolean
  loading?: () => React.ReactNode
}

function syncComponentForLoader<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>,
): React.ComponentType<P> | null {
  const src = loader.toString()
  if (src.includes('inspector-design-tab')) {
    return InspectorDesignTab as React.ComponentType<P>
  }
  if (src.includes('inspector-css-tab')) {
    return InspectorCssTab as React.ComponentType<P>
  }
  return null
}

/**
 * Vitest stand-in for `next/dynamic`: resolves known inspector lazy chunks synchronously
 * so tests can keep using `getBy*` (P109, P111).
 */
export default function dynamic<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>,
  _options?: DynamicOptions,
) {
  const Sync = syncComponentForLoader(loader)
  if (Sync) {
    void loader()
    return function DynamicComponent(props: P) {
      if (Sync === InspectorDesignTab) {
        return <InspectorDesignTab {...(props as InspectorDesignTabProps)} />
      }
      return <InspectorCssTab {...(props as InspectorCssTabProps)} />
    }
  }

  const Lazy = React.lazy(loader)
  return function DynamicComponent(props: P) {
    return (
      <React.Suspense fallback={null}>
        <Lazy {...props} />
      </React.Suspense>
    )
  }
}
