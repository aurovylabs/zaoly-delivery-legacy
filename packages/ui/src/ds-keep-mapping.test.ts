import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../../..')

describe('ds-keep-mapping knowledge', () => {
  it('documents Top-N exists mappings', () => {
    const doc = path.join(root, 'knowledge/ds-keep-mapping.md')
    expect(existsSync(doc)).toBe(true)
    const text = readFileSync(doc, 'utf8')
    expect(text).toContain('ds-stack')
    expect(text).toContain('`Stack`')
    expect(text).toContain('CanvasViewport')
  })
})
