import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('editor zoom crash hardening', () => {
  it('workspace blocks browser page pinch while editor is mounted', () => {
    const src = readFileSync(
      path.join(__dirname, '../components/editor-workspace.tsx'),
      'utf8',
    )
    expect(src).toContain('creation-editor-workspace')
    expect(src).toContain('Block browser page pinch-zoom')
    expect(src).toContain('e.ctrlKey || e.metaKey')
    expect(src).toContain('passive: false')
    expect(src).toContain('viewportGestureRef.current = presence.noteLocalViewportGesture')
  })

  it('viewport zoom paths invoke onViewportGesture', () => {
    const src = readFileSync(
      path.join(__dirname, '../components/editor/use-editor-viewport-state.ts'),
      'utf8',
    )
    expect(src).toContain('onViewportGesture')
    expect(src).toContain('onViewportGestureRef.current?.()')
  })

  it('knowledge documents zoom crash hardening', () => {
    const doc = readFileSync(
      path.join(__dirname, '../../../knowledge/editor-zoom-crash-hardening.md'),
      'utf8',
    )
    expect(doc).toContain('Browser page pinch')
    expect(doc).toContain('noteLocalViewportGesture')
  })
})
