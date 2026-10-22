import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const previewPath = join(dirname(fileURLToPath(import.meta.url)), '../../.storybook/preview.tsx')

describe('storybook preview', () => {
  it('loads the package styles entry', () => {
    const src = readFileSync(previewPath, 'utf8')
    expect(src).toContain("../src/styles.css")
    expect(src).toContain('data-theme')
  })
})
