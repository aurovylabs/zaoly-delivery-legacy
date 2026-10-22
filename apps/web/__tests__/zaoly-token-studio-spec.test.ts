import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'

const repoRoot = path.resolve(__dirname, '../../..')

describe('zaoly token studio specs + paths', () => {
  it('domain + api specs exist', () => {
    for (const rel of [
      'specs/domain/zaoly-token-studio.md',
      'specs/api/zaoly-tokens.md',
      'knowledge/zaoly-token-studio.md',
    ]) {
      const p = path.join(repoRoot, rel)
      expect(existsSync(p)).toBe(true)
      expect(readFileSync(p, 'utf8').length).toBeGreaterThan(100)
    }
    const domain = readFileSync(path.join(repoRoot, 'specs/domain/zaoly-token-studio.md'), 'utf8')
    expect(domain).toMatch(/same side edit dock as Edit/)
    expect(domain).toMatch(/path family → compound cluster/)
    expect(domain).toMatch(/uniform tile geometry/)
    expect(domain).toMatch(/title clamped to two lines/)
    expect(domain).toMatch(/pack-path-groups/)
    expect(domain).toMatch(/New group/)
    expect(domain).toMatch(/withEmptyPathFamilies/)
    expect(domain).toMatch(/clearly separated panels/)
    const knowledge = readFileSync(path.join(repoRoot, 'knowledge/zaoly-token-studio.md'), 'utf8')
    expect(knowledge).toMatch(/Catalog grouping/)
    expect(knowledge).toMatch(/linkHover/)
    expect(knowledge).toMatch(/New group/)
    expect(knowledge).toMatch(/Add token/)
    expect(knowledge).toMatch(/2-line title clamp/)
    expect(domain).toMatch(/No separate modal/)
    expect(domain).toMatch(/snaps to the nearest 1rem intersection/)
    expect(domain).toMatch(/translucent accent fill over a 1rem checkerboard/)
    expect(domain).toMatch(/size maps the leaf as an accent square/)
    expect(domain).toMatch(/multi-line specimen/)
    expect(domain).toMatch(/hairline rules between lines at each line-height/)
    expect(domain).toMatch(/very light grid wash/)
    expect(domain).toMatch(/light cream paper sheet/)
    expect(domain).toMatch(/elevated light plate \(`#FBF6EC`\) with the live `box-shadow`/)
    expect(domain).toMatch(/hairline ghost rest box/)
    expect(domain).toMatch(/dark charcoal sheet/)
    expect(domain).toMatch(/live CSS `filter`/)
    expect(domain).toMatch(/Zaoly local pack types/)
    expect(domain).toMatch(/digital `duration` \+ `easing`/)
    expect(domain).toMatch(/`motion\.\*`/)
    expect(domain).toMatch(/side edit dock/)
    expect(domain).toMatch(/endless scale wheels/)
    expect(domain).toMatch(/extends past catalog steps|edge-gap/)
    expect(domain).toMatch(/moves the scale/)
    expect(domain).toMatch(/live media preview/)
    expect(domain).toMatch(/token specimen/)
    expect(domain).toMatch(/not on the static inner module/)
    expect(domain).toMatch(/cubic-bezier pad/)
    expect(domain).toMatch(/two draggable control points/)
    expect(domain).toMatch(/stack full width/)
    expect(domain).toMatch(/no two-column split/)
    expect(domain).toMatch(/MUST NOT depend on an upstream brand pack/)
    expect(domain).toMatch(/PATCH \/api\/tokens/)
    expect(domain).toMatch(/MUST NOT call an upstream pack/)
    expect(domain).toMatch(/Derived expressions/)
    expect(domain).toMatch(/Smart compose/)
    expect(domain).toMatch(/listSmartComposeCandidates|Cycle-safe|Link from value/)
    expect(domain).toMatch(/Same field chrome|digital value field/)
    expect(domain).toMatch(/Color digital formats/)
    expect(domain).toMatch(/OKLCH/)
    expect(domain).toMatch(/Rename/)
    expect(domain).toMatch(/fromPath/)
    expect(domain).toMatch(/Shadow digital/)
    expect(domain).toMatch(/signed px/)
    expect(domain).toMatch(/Glow digital/)
    expect(domain).toMatch(/\{path\.to\.token\}/)
    expect(domain).toMatch(/color-mix\(in oklch/)
    expect(domain).toMatch(/Cards \| JSON \| CSS/)
    expect(domain).toMatch(/pack-export/)
    expect(domain).toMatch(/no list layout/)
    expect(domain).toMatch(/pack-validate/)
    expect(domain).toMatch(/atomic/)
    expect(domain).toMatch(/Import/)
    expect(domain).toMatch(/Download/)
    expect(domain).toMatch(/com\.zaoly\.studio/)
    expect(domain).toMatch(/pack-leaf-status/)
    expect(domain).toMatch(/Unresolved/)
    expect(domain).toMatch(/Override/)
    expect(domain).toMatch(/fixtureBaselineForPath/)
    expect(domain).toMatch(/Unresolved \/ Override \/ Custom/)
    expect(domain).toMatch(/status-specific empty message/)
    expect(domain).toMatch(/tokensFocus/)
    expect(domain).toMatch(/Deep-link/)
    expect(domain).toMatch(/Revert all overrides/)
    expect(domain).toMatch(/Open hub/)
    expect(domain).toMatch(/Open in hub/)
    expect(domain).not.toMatch(/sticky inspector/)
    const api = readFileSync(path.join(repoRoot, 'specs/api/zaoly-tokens.md'), 'utf8')
    expect(api).toMatch(/value_too_large/)
    expect(api).toMatch(/expr_cycle/)
    expect(api).toMatch(/atomic/)
    expect(api).toMatch(/POST `\/api\/tokens\/import`/)
    expect(paths.tokenPackMaxValueBytes).toBe(16_384)
    expect(paths.routes.apiTokensImport).toBe('/api/tokens/import')
    expect(paths.tokenPackDownloadJsonName).toBe('zaoly-tokens.json')
    expect(
      existsSync(path.join(repoRoot, 'knowledge/upstream-pack-out-of-scope-for-zaoly.md')),
    ).toBe(true)
  })

  it('exposes hub + pack routes', () => {
    expect(paths.routes.tokens).toBe('/tokens')
    expect(paths.routes.apiTokens).toBe('/api/tokens')
    expect(paths.tokenPackStoreRelPath).toBe('.data/token-pack.json')
    expect(paths.envTokenPackStorePath).toBe('ZAOLY_TOKEN_PACK_PATH')
    expect(paths.tokenPackPathQueryKey).toBe('path')
    expect(paths.routes.tokensFocus('color.action.primary')).toBe(
      `/tokens?${paths.tokenPackPathQueryKey}=color.action.primary`,
    )
  })

  it('keeps editor and rail on the local pack API', () => {
    const standalone = readFileSync(path.join(repoRoot, 'specs/domain/zaoly-standalone.md'), 'utf8')
    expect(standalone).toMatch(/Consume or push an upstream brand pack/)
    const scene = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor/use-editor-scene-state.ts'),
      'utf8',
    )
    expect(scene).toContain('apiTokens')
    expect(scene).not.toContain('editorBrandTokensUrl')
    const rail = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor-token-studio.tsx'),
      'utf8',
    )
    expect(rail).toContain('apiTokens')
    expect(rail).not.toContain('apiBrandTokens')
    const brandRoute = readFileSync(
      path.join(repoRoot, 'apps/web/app/api/brand-tokens/route.ts'),
      'utf8',
    )
    expect(brandRoute).toContain('upstreamPackOutOfScopeResponse')
    expect(brandRoute).not.toContain('resolveBrandTokenPack')
  })
})
