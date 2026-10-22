import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isPublicPath } from '../lib/middleware-public-paths'
import { paths } from '../lib/paths'

describe('zaoly corporate design', () => {
  const corporate = readFileSync(path.join(__dirname, '../css/zaoly-corporate.css'), 'utf8')
  const globals = readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8')
  const shell = readFileSync(path.join(__dirname, '../components/shell-brand-corner.tsx'), 'utf8')

  it('loads CD overlay after DS styles', () => {
    expect(globals.indexOf("@import '@zaoly/ui/styles.css'")).toBeGreaterThanOrEqual(0)
    expect(globals.indexOf('zaoly-corporate.css')).toBeGreaterThan(
      globals.indexOf("@import '@zaoly/ui/styles.css'"),
    )
  })

  it('locks cream / cobalt / acid / radius 0 for light', () => {
    expect(corporate).toMatch(/--accent:\s*#1f44ff/i)
    expect(corporate).toMatch(/--bg0:\s*#f3eee4/i)
    expect(corporate).toMatch(/--editor-live:\s*#c6f24a/i)
    expect(corporate).toMatch(/--radius:\s*0/)
    expect(corporate).not.toMatch(/--accent:\s*#ff6a3b/i)
  })

  it('kills suite atmosphere gradients for flat CD ground', () => {
    expect(corporate).toMatch(/--atmosphere-a:\s*transparent/)
    expect(corporate).toMatch(/--atmosphere-b:\s*transparent/)
    expect(corporate).toMatch(/\.atmosphere\s*\{[^}]*display:\s*none\s*!important/s)
    expect(corporate).toMatch(/body\s*\{[^}]*background-image:\s*none\s*!important/s)
  })

  it('locks dark column cobalt lift', () => {
    expect(corporate).toMatch(/zaoly-dark[\s\S]*--accent:\s*#3e63ff/i)
  })

  it('defaults to light theme, English locale, and sharp brand corner', () => {
    expect(paths.defaultTheme).toBe('light')
    expect(paths.defaultLocale).toBe('en')
    expect(paths.brandCornerRadiusPx).toBe(0)
    expect(paths.productSealGlyph).toBe('造')
    const prefs = readFileSync(path.join(__dirname, '../lib/user-prefs.tsx'), 'utf8')
    expect(prefs).toContain('if (!raw) return paths.defaultTheme')
    const localeServer = readFileSync(
      path.join(__dirname, '../lib/public-site-locale-server.ts'),
      'utf8',
    )
    expect(localeServer).toContain('paths.defaultLocale')
    expect(localeServer).not.toContain('accept-language')
  })

  it('uses acid lime for inspect glyph highlights (not cobalt fill)', () => {
    expect(corporate).toMatch(
      /\.ds-inspect-glyph__accent\s*\{[^}]*stroke:\s*var\(--editor-live\)/s,
    )
    expect(corporate).toMatch(
      /\.is-active \.ds-inspect-glyph__frame[\s\S]*?stroke:\s*color-mix\(in srgb, var\(--editor-live\)/,
    )
    expect(corporate).not.toMatch(
      /\.ds-inspect-glyph\s*\{[^}]*color:\s*var\(--accent\)/s,
    )
  })

  it('ships Zaoly Bildmarke favicon assets via paths.brandAssets', () => {
    const webPublic = path.join(__dirname, '../public')
    expect(paths.brandAssets.favicon).toBe('/favicon.ico')
    expect(paths.brandAssets.faviconSvg).toBe('/favicon.svg')
    expect(paths.brandAssets.mark).toBe('/brand/zaoly-mark.svg')
    expect(paths.brandAssets.appleTouchIcon).toBe('/apple-touch-icon.png')
    for (const rel of [
      'favicon.ico',
      'favicon.svg',
      'apple-touch-icon.png',
      'brand/zaoly-mark.svg',
      'brand/zaoly-wordmark.svg',
    ]) {
      expect(existsSync(path.join(webPublic, rel))).toBe(true)
    }
    const mark = readFileSync(path.join(webPublic, 'brand/zaoly-mark.svg'), 'utf8')
    expect(mark).toMatch(/data:image\/png;base64,/)
    expect(mark).toMatch(/<image\b/i)
    expect(mark).not.toMatch(/<text[\s>]/i) // tabs lack CJK fonts — bake glyph
    expect(mark).not.toMatch(/M32\.5825 0H7\.74219/) // suite MSQDX geometry
    const favSvg = readFileSync(path.join(webPublic, 'favicon.svg'), 'utf8')
    expect(favSvg).toMatch(/data:image\/png;base64,/)
    expect(favSvg).toMatch(/<image\b/i)
    expect(favSvg).not.toMatch(/<text[\s>]/i)
    expect(favSvg).not.toMatch(/M32\.5825 0H7\.74219/)
    // Baked seal must be cobalt-dominant (not empty / not suite coral)
    const apple = readFileSync(path.join(webPublic, 'apple-touch-icon.png'))
    expect(apple[0]).toBe(0x89) // PNG magic
    expect(apple.length).toBeGreaterThan(500)
    const layout = readFileSync(path.join(__dirname, '../app/layout.tsx'), 'utf8')
    expect(layout).toContain('paths.brandAssets.faviconSvg')
    expect(layout).toContain('paths.brandAssets.favicon')
    expect(layout).toContain('paths.brandAssets.appleTouchIcon')
    // ICO listed before SVG so tabs prefer the baked multi-size icon
    expect(layout.indexOf('paths.brandAssets.favicon')).toBeLessThan(
      layout.indexOf('paths.brandAssets.faviconSvg'),
    )
    expect(isPublicPath(paths.brandAssets.favicon, 'GET')).toBe(true)
    expect(isPublicPath(paths.brandAssets.faviconSvg, 'GET')).toBe(true)
    expect(isPublicPath(paths.brandAssets.mark, 'GET')).toBe(true)
  })

  it('central brand primary is Zaoly cobalt and warm gray is kit token', () => {
    expect(paths.brandPrimaryHex).toBe('#1f44ff')
    expect(paths.brandPrimaryHexDark).toBe('#3e63ff')
    expect(paths.brandWarmGrayHex).toBe('#2e2a24')
    expect(paths.brandWarmGrayContrastHex).toBe('#f3eee4')
    expect(corporate).toMatch(/--editor-warm-gray:\s*#2e2a24/i)
    expect(corporate).toMatch(/--warm-gray:\s*var\(--editor-warm-gray\)/)
    expect(paths.defaultAccent).toBe('blue')
    expect(corporate).toMatch(/--brand-primary:\s*#1f44ff/i)
    const siteTokens = readFileSync(
      path.join(__dirname, '../../../packages/site-kit/src/tokens.css'),
      'utf8',
    )
    expect(siteTokens).toMatch(/--site-accent:\s*#1f44ff/i)
    expect(siteTokens).not.toMatch(/--site-accent:\s*#ff6a3b/i)
  })

  it('wires seal-only BrandCorner without product menu or label hover', () => {
    expect(shell).toContain('ZaolySealMark')
    expect(shell).toContain('mark={seal}')
    expect(shell).toContain('brand-corner--seal-only')
    expect(shell).not.toContain('BrandCornerProductMenu')
    expect(shell).toMatch(/label=["']["']/)
    expect(corporate).toMatch(/brand-corner--seal-only/)
  })

  it('sharpens Property Inspector chrome (no corners, CD surfaces)', () => {
    expect(corporate).toMatch(
      /Property Inspector[\s\S]*border-radius:\s*0\s*!important/,
    )
    expect(corporate).toMatch(
      /\.creation-inspect-state__bar[\s\S]*grid-template-columns:\s*repeat\(4/,
    )
    expect(globals).toMatch(
      /\.creation-inspect-state__chip\s*\{[^}]*border-radius:\s*0/s,
    )
  })

  it('sharpens Compositions hub chrome (radius 0 + CD + lime switch)', () => {
    expect(corporate).toMatch(/Compositions hub/)
    expect(corporate).toMatch(
      /\.creation-compositions-hub \*[\s\S]*?border-radius:\s*0\s*!important/,
    )
    expect(corporate).toMatch(
      /creation-compositions-hub[\s\S]*ds-hub-index-layout-switch button\.is-active[\s\S]*var\(--editor-live\)/,
    )
    expect(globals).toMatch(
      /\.creation-composition-card-preview\s*\{[^}]*border-radius:\s*0/s,
    )
    expect(globals).toMatch(
      /creation-composition-card-preview__scale[\s\S]*100cqw\s*\/\s*var\(--composition-preview-w\)/,
    )
    expect(corporate).toMatch(
      /creation-compositions-hub[\s\S]*ds-hub-index-card__panel[\s\S]*overflow:\s*hidden/,
    )
  })

  it('clears hub topbar under the fixed nav bar', () => {
    expect(globals).toMatch(
      /creation-app-frame--hub-chrome\[data-rail-edge[\s\S]*padding-top:\s*calc\(\s*var\(--zaoly-hub-bar-h/,
    )
    expect(corporate).toMatch(/--zaoly-hub-bar-h:\s*2\.6rem/)
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--hub-chrome \.topbar\s*\{[^}]*border-bottom:\s*none/s,
    )
  })

  it('uses white label on cobalt primary buttons', () => {
    expect(corporate).toMatch(/--editor-accent-ink:\s*#ffffff/i)
    expect(corporate).toMatch(
      /\.ds-btn--primary[\s\S]*color:\s*var\(--editor-accent-ink/i,
    )
    expect(corporate).toMatch(
      /\.creation-login\s+\.ds-btn--primary[\s\S]*color:\s*var\(--editor-accent-ink/i,
    )
  })

  it('paints canvas floating HUD with editor ink on CD panel surface', () => {
    expect(corporate).toMatch(
      /\.creation-canvas-floating-hud\s*\{[^}]*color:\s*var\(--editor-text\)/s,
    )
    expect(corporate).toMatch(
      /\.creation-canvas-floating-hud__btn\s*\{[^}]*color:\s*var\(--editor-text\)/s,
    )
    expect(corporate).toMatch(
      /\.creation-canvas-floating-hud__node-tag\s*\{[^}]*color:\s*var\(--editor-text\)/s,
    )
  })

  it('sharpens Kit Playground chrome (radius 0 + CD colors + lime active)', () => {
    expect(globals).toMatch(
      /\.creation-kit-playground__sidebar[\s\S]*?border-radius:\s*0/,
    )
    expect(globals).toMatch(
      /\.creation-kit-nav__item--active[\s\S]*?background:\s*var\(--editor-live/,
    )
    expect(globals).toMatch(
      /\.creation-kit-nav__item--active[\s\S]*?color:\s*var\(--editor-live-ink/,
    )
    expect(corporate).toMatch(/Kit Playground/)
    expect(corporate).toMatch(
      /\.creation-kit-playground \*[\s\S]*?border-radius:\s*0\s*!important/,
    )
  })

  it('reuses labeled hub nav bar on hubs and immersive editor', () => {
    const shell = readFileSync(
      path.join(__dirname, '../components/app-shell.tsx'),
      'utf8',
    )
    const globals = readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8')
    expect(shell).toContain('zaoly-hub-chrome')
    expect(shell).toContain('zaoly-hub-chrome__brand')
    expect(shell).toContain('showHubNavBar')
    expect(shell).not.toContain('EditorBrandMark')
    expect(shell).not.toContain("variant={hubChrome ? 'bar' : 'icons'}")
    expect(corporate).toMatch(/\.zaoly-hub-chrome/)
    expect(corporate).toMatch(/\.zaoly-hub-chrome__wordmark/)
    expect(corporate).toMatch(/font-weight:\s*300/)
    expect(corporate).toMatch(/\.creation-top-nav--bar/)
    expect(corporate).toMatch(
      /creation-top-nav--bar[\s\S]*background(?:-color)?:\s*var\(--editor-warm-gray\)\s*!important/i,
    )
    expect(corporate).toMatch(
      /creation-top-nav--bar[\s\S]*\.is-active[\s\S]*background(?:-color)?:\s*var\(--editor-live\)/i,
    )
    expect(corporate).toMatch(
      /creation-top-nav--bar[\s\S]*\.is-active[\s\S]*color:\s*var\(--editor-live-ink\)/i,
    )
    expect(corporate).toMatch(/--editor-live-ink:\s*#1e1b17/i)
    expect(corporate).toMatch(
      /zaoly-hub-chrome__brand \.zaoly-seal-mark[\s\S]*var\(--editor-seal-bg\)/i,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.topbar\s*\{[^}]*top:\s*var\(--zaoly-hub-bar-h/s,
    )
    expect(globals).toMatch(/creation-app-frame--hub-chrome/)
  })

  it('gives /admin/users Zaoly CD hub chrome', () => {
    const users = readFileSync(
      path.join(__dirname, '../components/settings-users-page.tsx'),
      'utf8',
    )
    expect(users).toContain('zaoly-users-hub')
    expect(users).not.toMatch(/from ['"]@zaoly\/ui['"]/)
    expect(corporate).toMatch(/\.zaoly-users-hub/)
    expect(corporate).toMatch(
      /zaoly-users-hub[\s\S]*border-radius:\s*0\s*!important/,
    )
    expect(corporate).toMatch(
      /zaoly-users-hub[\s\S]*--editor-live-ink/,
    )
    expect(corporate).toMatch(
      /\.app-frame \.zaoly-users-hub(?:,\s*\.app-frame \.zaoly-admin-hub)?\s*\{[^}]*width:\s*100%/s,
    )
    expect(corporate).toMatch(
      /\.app-frame \.zaoly-users-hub(?:,\s*\.app-frame \.zaoly-admin-hub)?\s*\{[^}]*max-width:\s*none/s,
    )
    expect(corporate).toMatch(
      /zaoly-users-hub__invite[\s\S]*width:\s*100%/,
    )
    expect(corporate).toMatch(
      /zaoly-users-hub__row[\s\S]*width:\s*100%/,
    )
    expect(corporate).toMatch(
      /ds-settings-band__body[\s\S]*align-items:\s*stretch/,
    )
    expect(corporate).toMatch(
      /zaoly-users-hub[\s\S]*\.section-chrome[\s\S]*border-bottom:\s*none/,
    )
  })

  it('gives /tokens magazine HubIndexCard chrome', () => {
    const hub = readFileSync(
      path.join(__dirname, '../components/token-studio-hub.tsx'),
      'utf8',
    )
    expect(hub).toContain('creation-magazine')
    expect(hub).toContain('HubIndexCard')
    expect(corporate).toMatch(/zaoly-token-studio__family/)
    expect(corporate).toMatch(/zaoly-token-studio__chapter-head/)
    expect(corporate).toMatch(/zaoly-token-studio__group-draft/)
    expect(corporate).toMatch(
      /\.zaoly-token-studio \.ds-hub-index-card__title[\s\S]*-webkit-line-clamp:\s*2/,
    )
    expect(corporate).toMatch(
      /\.zaoly-token-studio \.ds-hub-index-card__media[\s\S]*aspect-ratio:\s*16\s*\/\s*10/,
    )
    expect(corporate).toMatch(
      /\.zaoly-token-studio \.ds-hub-index-card__media[\s\S]*flex:\s*0\s+0\s+auto/,
    )
    expect(corporate).toMatch(/\.zaoly-token-studio__grid[\s\S]*align-items:\s*stretch/)
    expect(hub).toContain('openCreateInGroup')
    expect(hub).toContain('withEmptyPathFamilies')
    expect(hub).toContain('token-group-new-')
    expect(hub).toContain('token-card-create-')

    expect(corporate).toMatch(
      /zaoly-token-studio[\s\S]*border-radius:\s*0\s*!important/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio[\s\S]*ds-hub-index-card\.is-selected[\s\S]*--editor-live-ink/,
    )
    expect(corporate).toMatch(
      /is-selected \.zaoly-token-studio__space-map[\s\S]*--editor-live\b/,
    )
    expect(corporate).toMatch(
      /is-selected \.zaoly-token-studio__space-module[\s\S]*--editor-live-ink\b/,
    )
    expect(corporate).not.toMatch(
      /is-selected \.zaoly-token-studio__space-module[\s\S]*--editor-live\s*;/,
    )
    expect(hub).toContain('token-edit-dock')
    expect(hub).toContain('zaoly-token-studio__edit-dock')
    expect(hub).not.toContain('token-studio-edit-dialog')
    expect(hub).not.toContain('zaoly-token-studio__inspector')
    expect(corporate).toMatch(
      /zaoly-token-studio__edit-dock[\s\S]*border-radius:\s*0\s*!important/,
    )
    expect(corporate).toMatch(/zaoly-token-studio__wheel-notch/)
    expect(corporate).toMatch(/zaoly-token-studio__wheel-scale/)
    expect(corporate).toMatch(
      /zaoly-token-studio__snap[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    )
    expect(corporate).toMatch(
      /edit-dock \.zaoly-token-studio__fields > \.ds-field[\s\S]*align-items:\s*stretch/,
    )
    expect(corporate).toMatch(
      /edit-dock \.zaoly-token-studio__fields[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    )
    expect(corporate).not.toMatch(
      /edit-dock[\s\S]*fields--split[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax/,
    )
    expect(corporate).toMatch(/zaoly-token-studio__bezier-pad/)
    expect(corporate).toMatch(/zaoly-token-studio__bezier-handle/)
    expect(corporate).toMatch(/zaoly-token-studio__compose-link/)
    expect(corporate).toMatch(/zaoly-token-studio__compose-resolve/)
    expect(corporate).toMatch(/zaoly-token-studio__edit-dock-title-btn/)
    expect(corporate).toMatch(/zaoly-token-studio__color-formats/)
    expect(corporate).toMatch(/zaoly-token-studio__expr-input/)
    expect(corporate).toMatch(/zaoly-token-studio__expr-badge/)
    expect(corporate).toMatch(/zaoly-token-studio__view-switch/)
    expect(corporate).toMatch(/zaoly-token-studio__export-code/)
    expect(corporate).toMatch(/zaoly-token-studio__import-diff/)
    expect(corporate).toMatch(/zaoly-token-studio__badge--unresolved/)
    expect(corporate).toMatch(/zaoly-token-studio__badge--override/)
    expect(corporate).toMatch(/zaoly-token-studio__fixture-baseline/)
    expect(corporate).toMatch(/zaoly-token-studio__fixture-was/)
    expect(hub).toContain('formatTokenPackJson')
    expect(hub).toContain('catalogLeafStatus')
    expect(hub).toContain('formatTokenPackCss')
    expect(hub).toContain('downloadTokenPackText')
    expect(hub).toContain('apiTokensImport')
    expect(hub).not.toContain('HubIndexLayoutSwitch')
    expect(hub).not.toContain('viewList')
    expect(corporate).not.toMatch(/zaoly-token-studio__grid--list/)
    expect(corporate).toMatch(
      /\.zaoly-token-studio__expr-input-control[\s\S]*?color:\s*#1a1712\s*!important/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio-dialog[\s\S]*border-radius:\s*0\s*!important/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio[\s\S]*ds-hub-index-card__panel[\s\S]*padding:\s*0/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__space-sheet[\s\S]*--corner-x:\s*round\(nearest,\s*50%/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__radius-map[\s\S]*width:\s*var\(--corner-x\)/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__radius-module[\s\S]*border-bottom-right-radius:\s*var\(--token-radius/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__opacity-map[\s\S]*opacity:\s*var\(--token-opacity/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__size-map[\s\S]*width:\s*var\(--token-size/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__type-sheet[\s\S]*color-mix\(in srgb, var\(--editor-text\) 7%/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__type-specimen[\s\S]*font-size:\s*var\(--token-type-size/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__type-specimen[\s\S]*repeating-linear-gradient/,
    )
    expect(corporate).not.toMatch(
      /zaoly-token-studio__type-map[\s\S]*background-size:\s*100%\s*calc\(var\(--token-type-size/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__shadow-sheet[\s\S]*--shadow-paper:\s*#f3eee4/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__shadow-sheet[\s\S]*--shadow-plate:\s*#fbf6ec/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__shadow-plate[\s\S]*box-shadow:\s*var\(--token-shadow/,
    )
    expect(corporate).toMatch(/zaoly-token-studio__shadow-ghost/)
    expect(corporate).toMatch(
      /zaoly-token-studio__glow-sheet[\s\S]*--glow-paper:\s*#201c17/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__glow-plate[\s\S]*box-shadow:\s*var\(--token-glow/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__effect-specimen[\s\S]*grid-template-columns:\s*repeat\(3/,
    )
    expect(corporate).toMatch(
      /zaoly-token-studio__motion-plate[\s\S]*--token-motion-duration/,
    )
    expect(corporate).toMatch(/@keyframes zaoly-token-motion-nudge/)
  })
})

