import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { zaolyBrand, radii, spacing } from './index'
import { zaolyV2Dark, zaolyV2Light } from './colors'

const here = dirname(fileURLToPath(import.meta.url))

describe('design-system tokens', () => {
  it('exposes spacing scale 1–6', () => {
    expect(spacing[1]).toBe('0.25rem')
    expect(spacing[6]).toBe('2rem')
    expect(Object.keys(spacing)).toHaveLength(6)
  })

  it('exposes radii used by panels/chat', () => {
    expect(radii.sm).toBe('2px')
    expect(radii.panel).toBe('12px')
    expect(radii.pill).toBe('999px')
    expect(radii.sheet).toBe('1.75rem')
  })

  it('keeps brand orange as accent SoT', () => {
    expect(zaolyBrand.orange).toBe('#ff6a3b')
    expect(zaolyV2Light.accent).toBe(zaolyBrand.orange)
    expect(zaolyV2Dark.accent).toBe(zaolyBrand.orange)
    expect(zaolyV2Dark.bg0).toBe('#0c0c0c')
    expect(zaolyV2Light.bg0).toBe('#f6f4ee')
  })
})

describe('design-system CSS layers', () => {
  it('index.css imports all layers', () => {
    const indexCss = readFileSync(join(here, '../../index.css'), 'utf8')
    for (const layer of [
      'tokens.css',
      'motion.css',
      'typography.css',
      'button.css',
      'base.css',
      'ranked.css',
      'components.css',
      'briefing.css',
      'frame.css',
      'ultra-wide.css',
      'responsive.css',
      'chat.css',
      'chip.css',
    ]) {
      expect(indexCss).toContain(`design-system/css/${layer}`)
    }
  })

  it('defines motion duration and semantic recipes', () => {
    const tokensCss = readFileSync(join(here, '../css/tokens.css'), 'utf8')
    expect(tokensCss).toContain('--duration-fast:')
    expect(tokensCss).toContain('--motion-hover:')
    expect(tokensCss).toContain('prefers-reduced-motion: reduce')
  })

  it('defines typography size/weight/stack tokens from spec', () => {
    const tokensCss = readFileSync(join(here, '../css/tokens.css'), 'utf8')
    expect(tokensCss).toContain('--type-xs:')
    expect(tokensCss).toContain('--type-display:')
    expect(tokensCss).toContain('--type-brand:')
    expect(tokensCss).toContain('--weight-regular:')
    expect(tokensCss).toContain('--weight-bold:')
    expect(tokensCss).toContain('--stack-body:')
    const typoCss = readFileSync(join(here, '../css/typography.css'), 'utf8')
    expect(typoCss).toContain('.ds-text-hint')
    expect(typoCss).toContain('.ds-text-title')
    expect(typoCss).toContain('.ds-text-headline')
    expect(typoCss).toContain('.signal-title')
    expect(typoCss).toContain('var(--type-display)')
  })

  it('zaoly-ui themes define space + panel radius', () => {
    const tokensCss = readFileSync(join(here, '../css/tokens.css'), 'utf8')
    expect(tokensCss).toContain("[data-theme='zaoly-ui']")
    expect(tokensCss).toContain("[data-theme='zaoly-ui-dark']")
    expect(tokensCss).toContain('--space-1:')
    expect(tokensCss).toContain('--radius-panel:')
    expect(tokensCss).toContain("[data-theme='zaoly']")
    expect(tokensCss).toContain("[data-theme='zaoly-dark']")
    expect(tokensCss).toContain("[data-theme='forest']")
    expect(tokensCss).toContain('--surface-1: var(--bg1)')
    expect(tokensCss).toContain('--border: var(--line)')
  })

  it('defines web-system semantic aliases and scales', () => {
    const tokensCss = readFileSync(join(here, '../css/tokens.css'), 'utf8')
    expect(tokensCss).toContain('--background: var(--bg0)')
    expect(tokensCss).toContain('--foreground: var(--ink)')
    expect(tokensCss).toContain('--primary: var(--accent)')
    expect(tokensCss).toContain('--muted-foreground: var(--muted)')
    expect(tokensCss).toContain('--muted-surface:')
    expect(tokensCss).toContain('--ring:')
    expect(tokensCss).toContain('--shadow-md:')
    expect(tokensCss).toContain('--z-modal:')
    expect(tokensCss).toContain('--z-nav-rail:')
    expect(tokensCss).toContain('--breakpoint-sm:')
    expect(tokensCss).toContain('--breakpoint-2xl:')
  })
})
