'use client'

/**
 * Client resolve cache for Collection dataBindings paint.
 * Spec: specs/domain/collection-data-bind.md
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import {
  applyDataBindingsToProps,
  type CollectionDataResolvedValue,
} from './collection-data-core'
import { collectionDataResolveUrl } from '../paths'

type ResolveMap = Record<string, CollectionDataResolvedValue>

type CollectionDataContextValue = {
  resolved: ResolveMap
  applyToProps: (
    props: Record<string, unknown>,
    dataBindings: Record<string, string> | undefined,
  ) => Record<string, unknown>
}

const CollectionDataContext = createContext<CollectionDataContextValue>({
  resolved: {},
  applyToProps: (props) => props,
})

function collectDataRefs(node: SceneNode | undefined, into: Set<string>): void {
  if (!node) return
  if (node.dataBindings) {
    for (const ref of Object.values(node.dataBindings)) {
      if (ref.trim()) into.add(ref.trim())
    }
  }
  if (node.instanceOverrides?.dataBindings) {
    for (const ref of Object.values(node.instanceOverrides.dataBindings)) {
      if (ref.trim()) into.add(ref.trim())
    }
  }
  for (const child of node.children ?? []) collectDataRefs(child, into)
  if (node.breakpoints) {
    for (const ov of Object.values(node.breakpoints)) {
      if (!ov?.dataBindings) continue
      for (const ref of Object.values(ov.dataBindings)) {
        if (ref.trim()) into.add(ref.trim())
      }
    }
  }
}

function refsFromScene(scene: CompositionScene | null | undefined): string[] {
  const into = new Set<string>()
  if (!scene) return []
  collectDataRefs(scene.root, into)
  for (const page of scene.pages ?? []) collectDataRefs(page.root, into)
  return [...into]
}

export function CollectionDataProvider({
  scene,
  platformProjectId,
  children,
}: {
  scene: CompositionScene | null | undefined
  platformProjectId: string | null | undefined
  children: ReactNode
}) {
  const [resolved, setResolved] = useState<ResolveMap>({})
  const refsKey = useMemo(() => refsFromScene(scene).sort().join('\0'), [scene])
  const pid = platformProjectId?.trim() || ''

  useEffect(() => {
    const refs = refsKey ? refsKey.split('\0').filter(Boolean) : []
    if (!pid || refs.length === 0) {
      setResolved({})
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch(collectionDataResolveUrl(), {
          method: 'POST',
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify({ platformProjectId: pid, refs }),
          credentials: 'same-origin',
        })
        if (!res.ok || cancelled) return
        const body = (await res.json()) as { values?: ResolveMap }
        if (!cancelled && body.values) setResolved(body.values)
      } catch {
        if (!cancelled) setResolved({})
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [pid, refsKey])

  const applyToProps = useCallback(
    (props: Record<string, unknown>, dataBindings: Record<string, string> | undefined) =>
      applyDataBindingsToProps(props, dataBindings, resolved),
    [resolved],
  )

  const value = useMemo(
    () => ({ resolved, applyToProps }),
    [resolved, applyToProps],
  )

  return (
    <CollectionDataContext.Provider value={value}>{children}</CollectionDataContext.Provider>
  )
}

export function useCollectionDataResolve(): CollectionDataContextValue {
  return useContext(CollectionDataContext)
}
