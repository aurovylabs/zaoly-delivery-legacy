import { describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'
import {
  buildColorMixExpr,
  buildSpacingScaleExpr,
  compileTokenExprToCss,
  extractTokenRefs,
  listSmartComposeCandidates,
  looksLikeTokenExpr,
  parseCssLengthPx,
  pathToZaolyCssVar,
  pickDefaultComposeBase,
  resolveTokenExpr,
  rewriteTokenPathRefs,
  sharedPathPrefixDepth,
  wouldCreateCycle,
} from '../lib/tokens/token-expr'

describe('token-expr', () => {
  it('maps paths to zaoly CSS vars and extracts refs', () => {
    expect(pathToZaolyCssVar('spacing.static.medium')).toBe(
      `${paths.zaolyTokenCssVarPrefix}spacing-static-medium`,
    )
    expect(extractTokenRefs('calc({spacing.static.medium} * 2)')).toEqual([
      'spacing.static.medium',
    ])
    expect(looksLikeTokenExpr('calc({spacing.static.medium} * 2)')).toBe(true)
    expect(looksLikeTokenExpr('1rem')).toBe(false)
  })

  it('compiles and resolves spacing / color expressions', () => {
    const expr = buildSpacingScaleExpr('spacing.static.medium', 2)
    expect(expr).toBe('calc({spacing.static.medium} * 2)')
    expect(compileTokenExprToCss(expr)).toBe(
      `calc(var(${paths.zaolyTokenCssVarPrefix}spacing-static-medium) * 2)`,
    )
    expect(
      resolveTokenExpr(expr, (path) => (path === 'spacing.static.medium' ? '1rem' : null)),
    ).toBe('calc(1rem * 2)')
    expect(buildColorMixExpr('color.action.primary', 22, 'white')).toBe(
      'color-mix(in oklch, {color.action.primary} 22%, white)',
    )
  })

  it('detects cycles', () => {
    const map: Record<string, string> = {
      'spacing.a': 'calc({spacing.b} * 2)',
      'spacing.b': 'calc({spacing.a} * 2)',
    }
    expect(
      wouldCreateCycle('spacing.a', 'calc({spacing.b} * 2)', (p) => map[p] ?? null),
    ).toBe(true)
    expect(
      wouldCreateCycle('spacing.c', 'calc({spacing.static.medium} * 2)', () => '1rem'),
    ).toBe(false)
  })

  it('rewrites token path refs in stored values', () => {
    expect(
      rewriteTokenPathRefs(
        'calc({spacing.gap.tight} * 2)',
        'spacing.gap.tight',
        'spacing.gap.modules',
      ),
    ).toBe('calc({spacing.gap.modules} * 2)')
  })

  it('ranks smart compose candidates by family, literal, proximity', () => {
    expect(sharedPathPrefixDepth('color.action.primary', 'color.action.soft')).toBe(2)
    expect(parseCssLengthPx('1.5rem')).toBe(24)
    const map: Record<string, string> = {
      'spacing.static.medium': '1rem',
      'spacing.static.large': '2rem',
      'spacing.static.derived': 'calc({spacing.static.medium} * 2)',
      'spacing.inset.md': '0.75rem',
      'spacing.cycle.peer': 'calc({spacing.static.soft} * 2)',
    }
    const resolve = (p: string) => map[p] ?? null
    const ranked = listSmartComposeCandidates({
      leafPath: 'spacing.static.soft',
      currentDigital: '1.25rem',
      resolveCss: resolve,
      candidates: [
        { path: 'spacing.inset.md', digital: map['spacing.inset.md']! },
        { path: 'spacing.static.derived', digital: map['spacing.static.derived']! },
        { path: 'spacing.static.large', digital: map['spacing.static.large']! },
        { path: 'spacing.static.medium', digital: map['spacing.static.medium']! },
        { path: 'spacing.cycle.peer', digital: map['spacing.cycle.peer']! },
      ],
    })
    expect(ranked).toEqual([
      'spacing.static.medium',
      'spacing.static.large',
      'spacing.static.derived',
      'spacing.inset.md',
    ])
    expect(ranked).not.toContain('spacing.cycle.peer')
    expect(
      pickDefaultComposeBase({
        leafPath: 'spacing.static.soft',
        currentDigital: '1.25rem',
        resolveCss: resolve,
        candidates: [
          { path: 'spacing.inset.md', digital: '0.75rem' },
          { path: 'spacing.static.medium', digital: '1rem' },
        ],
      }),
    ).toBe('spacing.static.medium')
  })
})
