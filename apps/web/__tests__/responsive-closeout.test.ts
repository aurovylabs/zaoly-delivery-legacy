import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { paths } from '../lib/paths'
import {
  loadBreakpointCompareMode,
  saveBreakpointCompareMode,
} from '../lib/editor/breakpoint-compare-prefs'

const root = path.resolve(__dirname, '../../..')

describe('responsive breakpoint closeout (Wave G)', () => {
  const mem = new Map<string, string>()

  beforeEach(() => {
    mem.clear()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => mem.get(k) ?? null,
        setItem: (k: string, v: string) => {
          mem.set(k, v)
        },
        removeItem: (k: string) => {
          mem.delete(k)
        },
      },
    })
  })

  afterEach(() => {
    mem.clear()
  })

  it('persists Compare preference via paths key', () => {
    expect(paths.breakpointCompareStorageKey).toBe('zaoly.editor.breakpoint-compare.v1')
    expect(loadBreakpointCompareMode()).toBe(false)
    saveBreakpointCompareMode(true)
    expect(mem.get(paths.breakpointCompareStorageKey)).toBe('1')
    expect(loadBreakpointCompareMode()).toBe(true)
    saveBreakpointCompareMode(false)
    expect(loadBreakpointCompareMode()).toBe(false)
  })

  it('restores Compare after mount behind comparePrefsReady (no hydration / flash)', () => {
    const sceneState = readFileSync(
      path.join(root, 'apps/web/components/editor/use-editor-scene-state.ts'),
      'utf8',
    )
    expect(sceneState).toContain('comparePrefsReady')
    expect(sceneState).toContain('setComparePrefsReady(true)')
    expect(sceneState).toContain('setBreakpointCompareEnabled')
    expect(sceneState).toMatch(
      /comparePrefsReady &&\s*!editingMasterId &&\s*!breakpointCompareMode/,
    )
    expect(sceneState).toContain('masterMatrixMode')
    expect(sceneState).toMatch(
      /useEffect\(\(\) => \{\s*setBreakpointCompareMode\(loadBreakpointCompareMode\(\)\)/,
    )
    expect(sceneState).not.toMatch(
      /useState\(\(\) =>\s*typeof window !== 'undefined' \? loadBreakpointCompareMode/,
    )
  })

  it('documents Wave G closeout and freezes permanent non-goals', () => {
    const spec = readFileSync(
      path.join(root, 'specs/domain/responsive-breakpoint-closeout.md'),
      'utf8',
    )
    expect(spec).toContain('Wave G')
    expect(spec).toContain('Set-as-primary remapping')
    expect(spec).toContain('data-breakpoint-primary')
    expect(spec).toContain('breakpointCompareStorageKey')
  })

  it('enumerates shipped responsive specs A–G', () => {
    const dir = path.join(root, 'specs/domain')
    const files = readdirSync(dir).filter((f) => f.startsWith('responsive-breakpoint'))
    expect(files).toEqual(
      expect.arrayContaining([
        'responsive-breakpoint-board.md',
        'responsive-breakpoint-primary-secondary.md',
        'responsive-breakpoint-reset.md',
        'responsive-breakpoint-structure-lock.md',
        'responsive-breakpoint-closeout.md',
      ]),
    )
    const hub = readFileSync(
      path.join(root, 'knowledge/responsive-breakpoint-board.md'),
      'utf8',
    )
    expect(hub).toMatch(/Complete \(Waves A–G\)/)
    expect(hub).toContain('Wave G — closeout')
    expect(hub).toContain('Wave H')
    expect(hub).toContain('Wave I')
  })
})
