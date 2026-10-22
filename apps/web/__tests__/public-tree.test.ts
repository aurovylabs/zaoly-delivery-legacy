import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isPublicTree,
  PUBLIC_TREE_EXCLUDED_TESTS,
  repoRootFromWebLib,
} from '../lib/test/public-tree'

describe('public tree detection', () => {
  it('resolves monorepo root with a package.json', () => {
    expect(existsSync(path.join(repoRootFromWebLib, 'package.json'))).toBe(true)
  })

  it('treats this checkout as internal when knowledge/ exists', () => {
    const hasKnowledge = existsSync(path.join(repoRootFromWebLib, 'knowledge'))
    expect(isPublicTree(repoRootFromWebLib)).toBe(!hasKnowledge)
  })

  it('lists knowledge-gated vitest files for the public distribution', () => {
    expect(PUBLIC_TREE_EXCLUDED_TESTS.length).toBeGreaterThan(10)
    expect(PUBLIC_TREE_EXCLUDED_TESTS.some((p) => p.includes('specs-inventory'))).toBe(
      true,
    )
  })
})
