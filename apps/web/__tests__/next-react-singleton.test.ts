import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('next hydration / React singleton policy', () => {
  it('does not webpack-alias react (breaks Next compiled react)', () => {
    const src = readFileSync(resolve(__dirname, '../next.config.ts'), 'utf8')
    expect(src).not.toMatch(/^\s*react:\s*reactPath/m)
    expect(src).toMatch(/Do NOT alias `react`/)
    expect(src).toMatch(/next-react-singleton-hydration/)
  })

  it('BrandCorner / Field / Select suppress useId hydration noise', () => {
    const brand = readFileSync(
      resolve(__dirname, '../../../packages/ui/src/components/BrandCorner.tsx'),
      'utf8',
    )
    const field = readFileSync(
      resolve(__dirname, '../../../packages/ui/src/components/Field.tsx'),
      'utf8',
    )
    const select = readFileSync(
      resolve(__dirname, '../../../packages/ui/src/components/Select.tsx'),
      'utf8',
    )
    expect(brand).toMatch(/suppressHydrationWarning/)
    expect(field).toMatch(/suppressHydrationWarning/)
    expect(select).toMatch(/suppressHydrationWarning/)
  })

  it('root layout suppresses body hydration noise from extensions', () => {
    const layout = readFileSync(resolve(__dirname, '../app/layout.tsx'), 'utf8')
    expect(layout).toMatch(/<body[^>]*suppressHydrationWarning/)
  })
})
