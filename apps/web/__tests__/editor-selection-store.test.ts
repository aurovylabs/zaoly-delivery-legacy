import { describe, expect, it, beforeEach } from 'vitest'
import {
  getEditorSelectionRevision,
  getSceneNodeSelectedSnapshot,
  resetEditorSelectionStoreForTests,
  subscribeSceneNodeSelection,
  syncEditorSelectionFromIds,
} from '../lib/editor/editor-selection-store'

describe('editor-selection-store (P99)', () => {
  beforeEach(() => {
    resetEditorSelectionStoreForTests()
  })

  it('tracks membership via Set snapshot', () => {
    syncEditorSelectionFromIds(['a', 'b'])
    expect(getSceneNodeSelectedSnapshot('a')).toBe(true)
    expect(getSceneNodeSelectedSnapshot('c')).toBe(false)
  })

  it('bumps revision only when selection changes', () => {
    syncEditorSelectionFromIds(['a'])
    const v1 = getEditorSelectionRevision()
    syncEditorSelectionFromIds(['a'])
    expect(getEditorSelectionRevision()).toBe(v1)
    syncEditorSelectionFromIds(['b'])
    expect(getEditorSelectionRevision()).toBe(v1 + 1)
  })

  it('notifies only changed node ids', () => {
    syncEditorSelectionFromIds(['a'])
    const seen: string[] = []
    const unsubA = subscribeSceneNodeSelection('a', () => seen.push('a'))
    const unsubB = subscribeSceneNodeSelection('b', () => seen.push('b'))
    syncEditorSelectionFromIds(['b'])
    expect(seen.sort()).toEqual(['a', 'b'])
    unsubA()
    unsubB()
  })
})
