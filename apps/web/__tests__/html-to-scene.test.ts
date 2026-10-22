import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { applyHtmlImport } from '../lib/scene/apply-html-import'
import {
  htmlToSceneRoot,
  normalizeFlexAxis,
  extractGradientFromStyle,
  overlayStyleFromPseudo,
  parsePseudoSelectorHits,
  parseClassRulesFromDocument,
} from '../lib/scene/html-to-scene'

function minimalScene(): CompositionScene {
  return {
    id: 'scene-html-import',
    name: 'Import test',
    version: 1,
    root: { id: 'root', type: 'SiteStack', props: { direction: 'column' }, children: [] },
    updatedAt: '2026-08-24T12:00:00.000Z',
  }
}

function walk(node: SceneNode, visit: (n: SceneNode) => void) {
  visit(node)
  for (const c of node.children ?? []) walk(c, visit)
}

const LANDING_HTML = `
<section style="background:#0B1F33;padding:64px;gap:24px;display:flex;flex-direction:column">
  <h1 style="color:#F5F0E8;font-size:48px">Urban Glide</h1>
  <p style="color:#C8D0D8">City bikes for people who hate traffic.</p>
  <a class="btn" href="/buy" style="background:#E85D04;color:#fff;padding:12px 24px">Shop now</a>
  <img src="https://example.com/bike.jpg" alt="City bike" width="640" height="400" />
</section>
<nav style="display:flex;flex-direction:row;gap:16px;padding:16px">
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>
`

describe('htmlToSceneRoot', () => {
  it('maps a landing fragment to Site Kit with color literals and no tokenBindings', async () => {
    const result = await htmlToSceneRoot(LANDING_HTML)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.root.type).toBe('SiteStack')
    expect(result.stats.nodeCount).toBeGreaterThan(4)

    let foundButton = false
    let foundText = false
    let foundImage = false
    walk(result.root, (n) => {
      expect(n.tokenBindings).toBeUndefined()
      if (n.type === 'SiteButton') {
        foundButton = true
        expect(n.props?.children).toBe('Shop now')
        expect(n.props?.background).toBe('#E85D04')
      }
      if (n.type === 'SiteText' && n.props?.role === 'display') {
        foundText = true
        expect(n.props?.children).toContain('Urban Glide')
        expect(n.props?.color).toBe('#F5F0E8')
      }
      if (n.type === 'SiteImage') {
        foundImage = true
        expect(n.props?.alt).toBe('City bike')
        expect(n.style?.width).toBe(640)
      }
    })
    expect(foundButton).toBe(true)
    expect(foundText).toBe(true)
    expect(foundImage).toBe(true)
  })

  it('rejects empty html', async () => {
    const result = await htmlToSceneRoot('   ')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('html-empty')
  })

  it('maps inline svg to SiteSvg with sanitized markup', async () => {
    const result = await htmlToSceneRoot(`
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-label="Brand seal">
          <title>Brand seal</title>
          <circle cx="20" cy="20" r="16" fill="#1a1a1a"/>
        </svg>
      </div>
    `)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let svg: SceneNode | null = null
    walk(result.root, (n) => {
      if (n.type === 'SiteSvg') svg = n
    })
    expect(svg).toBeTruthy()
    expect(String(svg!.props?.markup ?? '')).toMatch(/<svg/i)
    expect(String(svg!.props?.markup ?? '')).toMatch(/circle/i)
    expect(svg!.props?.alt).toBe('Brand seal')
    expect(svg!.props?.viewBox).toBe('0 0 40 40')
    expect(svg!.props?.mark).toBe('custom')
    expect(svg!.style?.width).toBe(40)
    expect(svg!.style?.height).toBe(40)
  })

  it('maps class rules from <style> and defaults nav to row', async () => {
    const html = `
<style>
.nav { display: flex; flex-direction: row; gap: 24px; }
.stats { display: flex; flex-direction: row; gap: 32px; }
</style>
<header>
  <div>Zaoly</div>
  <nav class="nav">
    <a href="/a">Leistungen</a>
    <a href="/b">Projekte</a>
  </nav>
</header>
<div class="stats">
  <div><strong>120+</strong> Projekte</div>
  <div><strong>8 J.</strong> Erfahrung</div>
  <div><strong>98%</strong> Weiterempfehlung</div>
</div>
`
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const stacks: SceneNode[] = []
    walk(result.root, (n) => {
      if (n.type === 'SiteStack') stacks.push(n)
    })

    const navStack = stacks.find((s) => s.name === 'nav')
    expect(navStack?.props?.direction).toBe('row')

    const headerStack = stacks.find((s) => s.name === 'header')
    expect(headerStack?.props?.direction).toBe('row')

    const statsStack = stacks.find((s) => s.name === 'div' && s.props?.direction === 'row')
    expect(statsStack).toBeTruthy()
  })

  it('reads body/:root background and coalesces split metric spans', async () => {
    const html = `
<style>
:root { --accent: #1f44ff; }
body { background: #0a0a0a; color: #f8f8f8; }
</style>
<header style="display:flex;flex-direction:row;gap:16px">
  <div><span>ZA</span><span>OLY</span></div>
</header>
<div class="stat">
  <span>3</span><span>+</span>
</div>
<section style="background:#111;padding:48px">
  <h1>Services</h1>
</section>
`
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.root.props?.background).toBe('#0a0a0a')
    expect(result.root.props?.color).toBe('#f8f8f8')

    const texts: string[] = []
    walk(result.root, (n) => {
      if (n.type === 'SiteText' && typeof n.props?.children === 'string') {
        texts.push(n.props.children)
      }
    })
    expect(texts.some((t) => t === '3+' || t === 'Zaoly')).toBe(true)
    expect(texts).not.toContain('3')
    expect(texts).not.toContain('+')
  })

  it('resolves :root CSS vars to hex literals on import', async () => {
    const html = `
<style>
:root {
  --ink: #f8f8f8;
  --muted: #6b6b6b;
  --accent: #1f44ff;
  --bg: #0b0b0b;
  --line: #222222;
}
body { background: var(--bg); color: var(--ink); }
</style>
<section style="padding:48px;color:var(--muted)">
  <p style="color:var(--accent)">Badge</p>
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px;background:var(--line)">
    <div style="background:var(--bg);padding:24px;color:var(--ink)">Card A</div>
    <div style="background:var(--bg);padding:24px;color:var(--ink)">Card B</div>
  </div>
</section>
`
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.root.props?.background).toBe('#0b0b0b')
    expect(result.root.props?.color).toBe('#f8f8f8')

    let foundGrid = false
    let foundAccent = false
    walk(result.root, (n) => {
      const props = JSON.stringify(n.props ?? {})
      expect(props).not.toMatch(/var\(--/)
      if (n.type === 'SiteGrid') {
        foundGrid = true
        expect(n.props?.background).toBe('#222222')
        expect(n.props?.columns).toBe(2)
      }
      if (n.type === 'SiteText' && n.props?.children === 'Badge') {
        foundAccent = true
        expect(n.props?.color).toBe('#1f44ff')
      }
    })
    expect(foundGrid).toBe(true)
    expect(foundAccent).toBe(true)
  })

  it('maps border shorthands and per-side lines to node.style', async () => {
    const html = `
<style>
:root { --line: rgba(43, 36, 32, .24); --paper-light: #fbf6ec; }
.hero { color: var(--paper-light); background: #7f2f2d; }
.nav { border-bottom: 1px solid rgba(255,255,255,.38); }
.seal { border: 1px solid currentColor; border-radius: 50%; }
.intro { border-bottom: 1px solid var(--line); }
.craft-list li { border-bottom: 1px solid var(--line); }
</style>
<section class="hero">
  <nav class="nav"><div class="seal">L</div></nav>
</section>
<section class="intro"><p>Band</p></section>
<ul class="craft-list"><li>Craft row</li></ul>
`
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    let navBorder = false
    let sealBorder = false
    let introBorder = false
    let listItemBorder = false
    walk(result.root, (n) => {
      if (n.name === 'nav' && n.style?.borderBottom?.includes('rgba(255,255,255')) {
        navBorder = true
      }
      if (n.props?.children === 'L' && n.style?.border?.includes('#fbf6ec')) {
        sealBorder = true
      }
      if (n.name === 'section' && n.style?.borderBottom?.includes('rgba(43, 36, 32')) {
        introBorder = true
      }
      if (n.name === 'li' && n.style?.borderBottom?.includes('rgba(43, 36, 32')) {
        listItemBorder = true
      }
    })
    expect(navBorder).toBe(true)
    expect(sealBorder).toBe(true)
    expect(introBorder).toBe(true)
    expect(listItemBorder).toBe(true)
  })

  it('maps P2-A contract props (typo, flex, margin, overflow, dims)', async () => {
    const html = `
<style>
.nav { display: flex; flex-direction: row; align-items: start; letter-spacing: .09em; text-transform: uppercase; }
.nav-links { display: flex; justify-content: flex-end; gap: 1.6rem; }
.seal { width: 3.3rem; aspect-ratio: 1; font-style: italic; }
.panel { overflow: hidden; max-width: 18rem; opacity: 0.84; }
.kicker { margin: 0 0 1rem; text-align: center; }
</style>
<header class="nav">
  <div class="nav-links"><a href="#a">Entdecken</a></div>
  <span class="seal">L</span>
</header>
<div class="panel"></div>
<p class="kicker">Willkommen</p>
`
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    let navTypo = false
    let linksJustify = false
    let sealDims = false
    let panelOverflow = false
    let kickerMargin = false
    walk(result.root, (n) => {
      if (n.name === 'header' && n.props?.letterSpacing === '.09em') {
        navTypo = true
        expect(n.props?.textTransform).toBe('uppercase')
        expect(n.props?.align).toBe('flex-start')
      }
      if (n.name === 'div' && n.props?.justify === 'flex-end') {
        linksJustify = true
      }
      if (n.props?.children === 'L') {
        sealDims = true
        expect(n.style?.aspectRatio).toBe('1')
        expect(n.style?.fontStyle).toBe('italic')
        expect(n.style?.width).toBe('3.3rem')
      }
      if (n.name === 'div' && n.props?.overflow === 'hidden' && n.props?.maxWidth === '18rem') {
        panelOverflow = true
        expect(n.props?.opacity).toBe(0.84)
      }
      if (n.props?.children === 'Willkommen') {
        kickerMargin = true
        expect(n.props?.margin).toBe('0 0 1rem')
        expect(n.props?.textAlign).toBe('center')
      }
    })
    expect(navTypo).toBe(true)
    expect(linksJustify).toBe(true)
    expect(sealDims).toBe(true)
    expect(panelOverflow).toBe(true)
    expect(kickerMargin).toBe(true)
  })

  it('maps P2-B craft (gradient, desc span, sibling, grid-column, colored em)', async () => {
    const html = `
<style>
:root { --wine: #7f2f2d; --ink: #2b2420; --serif: Georgia, serif; }
.brand { font: 700 1.4rem/1 var(--serif); }
.brand span { display: block; margin-top: .22rem; font-size: .53rem; letter-spacing: .15em; }
.intro h2 em { color: var(--wine); }
.day + .day { padding-left: 2rem; border-left: 1px solid var(--ink); }
.panel { background-image: linear-gradient(160deg, #dfb06f 0%, #a75942 58%, #513f34 100%); }
.note { grid-column: 2; max-width: 33rem; }
</style>
<a class="brand" href="#top">Lindenau<span>Stadt am Fluss</span></a>
<section class="intro">
  <h2>Eine Stadt.<br><em>Tausend Zeiten.</em></h2>
  <p class="note">Willkommen am Fluss</p>
</section>
<div class="day-grid">
  <div class="day">Tag 1</div>
  <div class="day">Tag 2</div>
</div>
<div class="panel"></div>
`
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    let brandSubline = false
    let wineEm = false
    let siblingBorder = false
    let gridCol = false
    let gradientPanel = false
    walk(result.root, (n) => {
      if (n.props?.children === 'Stadt am Fluss') {
        brandSubline = true
        expect(n.props?.letterSpacing).toBe('.15em')
        expect(n.props?.fontSize).toBe('.53rem')
      }
      if (n.props?.children === 'Tausend Zeiten.') {
        wineEm = true
        expect(n.props?.color).toBe('#7f2f2d')
      }
      if (n.props?.children === 'Tag 2' && n.style?.borderLeft?.includes('#2b2420')) {
        siblingBorder = true
        expect(n.props?.paddingLeft).toBe('2rem')
      }
      if (n.props?.children === 'Willkommen am Fluss' && n.style?.gridColumn === '2') {
        gridCol = true
      }
      if (n.name === 'div' && n.props?.gradient?.includes('linear-gradient')) {
        gradientPanel = true
      }
    })
    expect(brandSubline).toBe(true)
    expect(wineEm).toBe(true)
    expect(siblingBorder).toBe(true)
    expect(gridCol).toBe(true)
    expect(gradientPanel).toBe(true)
  })

  it('maps P2-C pseudo layers to decorative SiteStack children', async () => {
    const html = `
<style>
.hero-media { position: relative; min-height: 20rem; overflow: hidden; background: #b76c4f; }
.hero-media::before { content: ''; position: absolute; inset: 0; background: linear-gradient(160deg, #dfb06f 0%, #513f34 100%); opacity: .84; }
.hero-media::after { content: ''; position: absolute; width: 52%; height: 58%; right: 10%; bottom: -8%; border: 1.25rem solid rgba(242,234,220,.7); border-bottom: 0; border-radius: 12rem 12rem 0 0; transform: rotate(-4deg); }
.clip-only::after { clip-path: polygon(0 0, 100% 0, 100% 100%); }
</style>
<div class="hero-media" role="img" aria-label="Altstadt"></div>
<div class="clip-only"></div>
`
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    let beforeGrad = false
    let afterBorder = false
    let hostRelative = false
    walk(result.root, (n) => {
      if (n.name === '::before' && n.props?.gradient?.includes('linear-gradient')) {
        beforeGrad = true
        expect(n.props?.opacity).toBe(0.84)
        expect(n.style?.position).toBe('absolute')
      }
      if (n.name === '::after' && n.style?.border?.includes('rgba(242,234,220')) {
        afterBorder = true
        expect(n.style?.transform).toMatch(/rotate/)
      }
      if (n.name === 'Altstadt' && n.style?.position === 'relative') {
        hostRelative = true
      }
    })
    expect(beforeGrad).toBe(true)
    expect(afterBorder).toBe(true)
    expect(hostRelative).toBe(true)
    expect(result.warnings.some((w) => w.code === 'mapped-pseudo-to-decor')).toBe(true)
  })

  it('joins adjacent inline spans with spaces in headlines', async () => {
    const html = `
<h1 style="color:#f8f8f8"><span>Was</span><span>wir</span><span>mitbringen</span>.</h1>
<div><span>Wir</span><span>bauen</span><span>digitale</span><span>Produkte</span></div>
`
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const texts: string[] = []
    walk(result.root, (n) => {
      if (n.type === 'SiteText' && typeof n.props?.children === 'string') {
        texts.push(n.props.children)
      }
    })
    expect(texts.some((t) => /Was wir mitbringen/.test(t))).toBe(true)
    expect(texts.some((t) => /Wir bauen digitale Produkte/.test(t))).toBe(true)
    expect(texts.some((t) => t.includes('Waswir') || t.includes('Wirbauen'))).toBe(false)
  })

  it('maps tag selectors, font shorthand, skip chrome, and rows-only grids (Lindenau craft)', async () => {
    const html = `
<!doctype html>
<html lang="de">
<head>
<style>
  :root { --paper: #f2eadc; --ink: #2b2420; --wine: #7f2f2d; --serif: Georgia, serif; }
  body { margin: 0; color: var(--ink); background: var(--paper); }
  .skip { position: fixed; top: 1rem; left: 1rem; transform: translateY(-180%); }
  .hero { min-height: 100svh; padding: 1rem; color: #fbf6ec; background: var(--wine); display: grid; grid-template-rows: auto 1fr; }
  .nav { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; gap: 1rem; border-bottom: 1px solid rgba(255,255,255,.38); }
  .nav-links { display: flex; justify-content: flex-end; gap: 1.6rem; letter-spacing: .09em; text-transform: uppercase; font: 400 .72rem/1.2 system-ui, sans-serif; }
  .brand { font: 700 1.4rem/1 var(--serif); text-decoration: none; letter-spacing: -.04em; color: inherit; }
  .brand span { display: block; margin-top: .22rem; font: 400 .53rem/1 system-ui, sans-serif; letter-spacing: .15em; text-transform: uppercase; }
  .seal { width: 3.3rem; aspect-ratio: 1; border: 1px solid currentColor; border-radius: 50%; display: grid; place-items: center; font: 600 .85rem/1 var(--serif); }
  footer nav { display: flex; flex-direction: column; }
  h1 { margin: 0; font: 400 clamp(4.4rem, 11.4vw, 11.5rem)/.72 var(--serif); letter-spacing: -.075em; }
  .hero-stage { display: grid; grid-template-columns: minmax(0, 1fr) minmax(18rem, 34vw); gap: 1rem; }
  .hero-media { position: relative; min-height: min(70vh, 47rem); overflow: hidden; background: #b76c4f; }
  .hero-media::before { content: ''; position: absolute; inset: 0; background: linear-gradient(160deg, #dfb06f 0 35%, #a75942 35% 58%, #513f34 58% 100%); opacity: .84; }
  .intro { display: grid; grid-template-columns: 1fr 3fr; gap: 2rem; padding: 5rem 1rem; border-bottom: 1px solid rgba(43, 36, 32, .24); }
  .intro h2 { margin: 0; font: 400 clamp(3.2rem, 7.8vw, 8rem)/.86 var(--serif); letter-spacing: -.065em; }
  .intro h2 em { color: var(--wine); font-weight: 400; }
  @media (max-width: 760px) {
    .nav { grid-template-columns: 1fr auto; }
    .seal { display: none; }
    .hero-stage { grid-template-columns: 1fr; }
    h1 { font-size: clamp(4rem, 21vw, 7rem); }
  }
</style>
</head>
<body>
  <a class="skip" href="#entdecken">Zum Inhalt springen</a>
  <main>
    <section class="hero">
      <header class="nav">
        <a class="brand" href="#top">Lindenau<span>Stadt am Fluss</span></a>
        <span class="seal" aria-hidden="true">L</span>
        <nav class="nav-links" aria-label="Hauptnavigation">
          <a href="#entdecken">Entdecken</a>
          <a href="#erleben">Erleben</a>
        </nav>
      </header>
      <div class="hero-stage">
        <div class="hero-copy">
          <h1>Wo Zeit <em>Geschichten</em> trägt.</h1>
        </div>
        <div class="hero-media" role="img" aria-label="Altstadt"></div>
      </div>
    </section>
    <section class="intro">
      <p>Willkommen</p>
      <h2>Eine Stadt.<br><em>Tausend Zeiten.</em></h2>
    </section>
    <footer>
      <nav aria-label="Service"><a href="#a">A</a><a href="#b">B</a></nav>
    </footer>
  </main>
</body>
</html>
`
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.root.props?.gap).toBe('0')
    expect(result.root.props?.background).toBe('#f2eadc')

    const json = JSON.stringify(result.root)
    expect(json).not.toContain('Zum Inhalt springen')
    expect(json).toContain('Lindenau')
    expect(json).toContain('Stadt am Fluss')
    expect(json).toMatch(/Eine Stadt\./)
    expect(json).toContain('Tausend Zeiten.')

    let foundDisplay = false
    let foundHeroStack = false
    let foundNavGrid = false
    let foundStageGrid = false
    let foundIntroGrid = false
    let foundMediaHeight = false
    let foundNavLinksRow = false
    let foundSeal = false
    let foundNavBorder = false
    let foundIntroBorder = false
    let foundBrandSubline = false
    let foundWineEm = false
    let foundHeroPseudo = false
    let foundBrandWordmark = false
    let foundCreamNavLink = false
    let foundCenteredSeal = false
    walk(result.root, (n) => {
      if (n.type === 'SiteText' && n.props?.role === 'display') {
        foundDisplay = true
        expect(String(n.props?.fontSize ?? '')).toMatch(/clamp\(4\.4rem/i)
        expect(String(n.props?.fontFamily ?? '')).toMatch(/Georgia/i)
      }
      if (n.type === 'SiteStack' && n.name === 'section' && n.props?.background === '#7f2f2d') {
        foundHeroStack = true
        expect(n.props?.direction).toBe('column')
        expect(n.style?.height).toBe(800)
      }
      if (n.type === 'SiteGrid' && n.props?.columns === 3) {
        foundNavGrid = true
        expect(String(n.props?.gridTemplateColumns ?? '')).toMatch(/1fr\s+auto\s+1fr/)
        if (n.style?.borderBottom?.includes('rgba(255,255,255')) foundNavBorder = true
      }
      if (n.type === 'SiteGrid' && n.props?.columns === 2) {
        if (String(n.props?.gridTemplateColumns ?? '').includes('minmax')) foundStageGrid = true
        if (String(n.props?.gridTemplateColumns ?? '').includes('3fr')) foundIntroGrid = true
      }
      if (n.name === 'section' && n.style?.borderBottom?.includes('rgba(43, 36, 32')) {
        foundIntroBorder = true
      }
      if (
        n.type === 'SiteGrid' &&
        String(n.props?.gridTemplateColumns ?? '').includes('3fr') &&
        n.style?.borderBottom?.includes('rgba(43, 36, 32')
      ) {
        foundIntroBorder = true
      }
      if (n.style?.height && n.style.height >= 400 && n.props?.background === '#b76c4f') {
        foundMediaHeight = true
      }
      if (n.type === 'SiteStack' && n.name === 'Hauptnavigation') {
        expect(n.props?.direction).toBe('row')
        foundNavLinksRow = true
      }
      if (
        n.type === 'SiteStack' &&
        (n.name === 'seal' || String(n.name).includes('seal')) &&
        n.children?.some((c) => c.props?.children === 'L')
      ) {
        foundSeal = true
        foundCenteredSeal =
          n.props?.align === 'center' &&
          n.props?.justify === 'center' &&
          Boolean(n.style?.aspectRatio) &&
          Boolean(n.props?.radius === '50%' || n.style?.borderRadius === '50%')
      }
      if (n.type === 'SiteText' && n.props?.children === 'L') foundSeal = true
      if (n.type === 'SiteStack' && n.name === 'span' && n.children?.some((c) => c.props?.children === 'L')) {
        foundSeal = true
      }
      if (
        n.type === 'SiteText' &&
        n.props?.children === 'Lindenau' &&
        String(n.props?.fontFamily ?? '').match(/Georgia/i)
      ) {
        foundBrandWordmark = true
      }
      if (
        n.type === 'SiteLink' &&
        String(n.props?.children ?? '').toLowerCase().includes('entdecken') &&
        n.props?.color === '#fbf6ec' &&
        n.props?.textTransform === 'uppercase'
      ) {
        foundCreamNavLink = true
      }
      if (n.props?.children === 'Stadt am Fluss' && n.props?.letterSpacing === '.15em') {
        foundBrandSubline = true
      }
      if (n.props?.children === 'Tausend Zeiten.' && n.props?.color === '#7f2f2d') {
        foundWineEm = true
      }
      if (n.name === '::before' && n.props?.gradient?.includes('linear-gradient')) {
        foundHeroPseudo = true
      }
    })
    expect(foundDisplay).toBe(true)
    expect(foundHeroStack).toBe(true)
    expect(foundNavGrid).toBe(true)
    expect(foundStageGrid).toBe(true)
    expect(foundIntroGrid).toBe(true)
    expect(foundMediaHeight).toBe(true)
    expect(foundNavLinksRow).toBe(true)
    expect(foundSeal).toBe(true)
    expect(foundCenteredSeal).toBe(true)
    expect(foundBrandWordmark).toBe(true)
    expect(foundCreamNavLink).toBe(true)
    expect(foundNavBorder).toBe(true)
    expect(foundIntroBorder).toBe(true)
    expect(foundBrandSubline).toBe(true)
    expect(foundWineEm).toBe(true)
    expect(foundHeroPseudo).toBe(true)
    expect(result.warnings.some((w) => w.code === 'omitted-hidden-chrome')).toBe(true)
    expect(result.warnings.some((w) => w.code === 'mapped-pseudo-to-decor')).toBe(true)
  })
})

describe('html import helpers', () => {
  it('normalizeFlexAxis maps start/end to flex-start/flex-end', () => {
    expect(normalizeFlexAxis('start')).toBe('flex-start')
    expect(normalizeFlexAxis('end')).toBe('flex-end')
    expect(normalizeFlexAxis('center')).toBe('center')
  })

  it('extractGradientFromStyle pulls gradient from background shorthands', () => {
    const g = extractGradientFromStyle({
      background: 'linear-gradient(160deg, #a 0%, #b 100%)',
    })
    expect(g).toMatch(/linear-gradient\(160deg/)
  })

  it('parsePseudoSelectorHits reads comma-separated pseudo selectors', () => {
    const hits = parsePseudoSelectorHits('.hero-media::before, .hero-media::after')
    expect(hits).toEqual([
      { class: 'hero-media', pseudo: 'before' },
      { class: 'hero-media', pseudo: 'after' },
    ])
  })

  it('parseClassRulesFromDocument stores pseudo:before/after rules', async () => {
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(`<style>
.hero-media::before { inset: 0; background: linear-gradient(160deg, #a, #b); opacity: .84; }
.hero-media::after { border: 1px solid red; }
</style>`)
    const rules = parseClassRulesFromDocument(dom.window.document)
    expect([...rules.keys()].filter((k) => k.startsWith('pseudo:')).sort()).toEqual([
      'pseudo:hero-media:after',
      'pseudo:hero-media:before',
    ])
    expect(rules.get('pseudo:hero-media:before')?.background).toMatch(/linear-gradient/)
    expect(rules.get('pseudo:hero-media:after')?.border).toBe('1px solid red')
  })

  it('overlayStyleFromPseudo maps inset and absolute paint', () => {
    const style = overlayStyleFromPseudo({
      inset: '0',
      opacity: '0.84',
      background: 'linear-gradient(160deg, #a, #b)',
    })
    expect(style.position).toBe('absolute')
    expect(style.inset).toBe('0')
    expect(style.pointerEvents).toBe('none')
  })
})

describe('P2 Select/Input/Badge', () => {
  it('maps email input to SiteInput', async () => {
    const result = await htmlToSceneRoot(
      '<form><input type="email" name="email" placeholder="Email" value="a@b.c" /></form>',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let found: SceneNode | undefined
    walk(result.root, (n) => {
      if (n.type === 'SiteInput') found = n
    })
    expect(found).toBeTruthy()
    expect(found?.props?.type).toBe('email')
    expect(found?.props?.placeholder).toBe('Email')
    expect(found?.props?.name).toBe('email')
    expect(found?.props?.defaultValue).toBe('a@b.c')
  })

  it('maps textarea to SiteTextarea with rows', async () => {
    const result = await htmlToSceneRoot(
      '<textarea name="msg" rows="4" placeholder="Message">Hello</textarea>',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let found: SceneNode | undefined
    walk(result.root, (n) => {
      if (n.type === 'SiteTextarea') found = n
    })
    expect(found).toBeTruthy()
    expect(found?.props?.placeholder).toBe('Message')
    expect(found?.props?.rows).toBe(4)
    expect(found?.props?.defaultValue).toBe('Hello')
  })

  it('maps select options to newline string and selected defaultValue', async () => {
    const result = await htmlToSceneRoot(`
      <select name="size">
        <option value="s">Small</option>
        <option value="l" selected>Large</option>
      </select>
    `)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let found: SceneNode | undefined
    walk(result.root, (n) => {
      if (n.type === 'SiteSelect') found = n
    })
    expect(found).toBeTruthy()
    expect(found?.props?.options).toBe('s|Small\nl|Large')
    expect(found?.props?.defaultValue).toBe('l')
  })

  it('omits hidden inputs', async () => {
    const result = await htmlToSceneRoot(
      '<form><input type="hidden" name="csrf" value="x" /><input type="text" placeholder="Name" /></form>',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let inputs = 0
    let hiddenLike = false
    walk(result.root, (n) => {
      if (n.type === 'SiteInput') {
        inputs += 1
        if (n.props?.type === 'hidden' || n.props?.name === 'csrf') hiddenLike = true
      }
    })
    expect(inputs).toBe(1)
    expect(hiddenLike).toBe(false)
  })

  it('maps submit input to SiteButton', async () => {
    const result = await htmlToSceneRoot('<input type="submit" value="Send" />')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let found: SceneNode | undefined
    walk(result.root, (n) => {
      if (n.type === 'SiteButton') found = n
    })
    expect(found?.props?.children).toBe('Send')
  })

  it('maps class=badge short text to SiteBadge', async () => {
    const result = await htmlToSceneRoot('<span class="badge">New</span>')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let found: SceneNode | undefined
    walk(result.root, (n) => {
      if (n.type === 'SiteBadge') found = n
    })
    expect(found?.props?.children).toBe('New')
  })

  it('maps pill radius + background short text to SiteBadge', async () => {
    const result = await htmlToSceneRoot(
      '<span style="border-radius:999px;background:#E85D04;color:#fff;padding:4px 10px">Sale</span>',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let found: SceneNode | undefined
    walk(result.root, (n) => {
      if (n.type === 'SiteBadge') found = n
    })
    expect(found?.props?.children).toBe('Sale')
    expect(found?.props?.background).toBe('#E85D04')
  })

  it('keeps long rounded paragraphs as SiteText', async () => {
    const long =
      'This is a long paragraph that should remain body text even with a large border radius applied for layout.'
    const result = await htmlToSceneRoot(
      `<p style="border-radius:12px;background:#f5f5f5">${long}</p>`,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    let badge = false
    let text = false
    walk(result.root, (n) => {
      if (n.type === 'SiteBadge') badge = true
      if (n.type === 'SiteText' && String(n.props?.children ?? '').includes('long paragraph')) {
        text = true
      }
    })
    expect(badge).toBe(false)
    expect(text).toBe(true)
  })
})

describe('applyHtmlImport', () => {
  it('replaces the active page root', async () => {
    const scene = minimalScene()
    const result = await applyHtmlImport(scene, { html: LANDING_HTML })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.root.type).toBe('SiteStack')
    expect(result.scene.root.children?.length).toBeGreaterThan(0)
    expect(result.pageId).toBeTruthy()
    expect(result.stats.nodeCount).toBeGreaterThan(3)
  })

  it('adds a named page then imports into it', async () => {
    const scene = minimalScene()
    const result = await applyHtmlImport(scene, {
      html: '<h1>Pricing</h1><p>Plans</p>',
      pageName: 'Pricing',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.pages?.length).toBe(2)
    expect(result.scene.pages?.some((p) => p.name === 'Pricing')).toBe(true)
    expect(result.scene.activePageId).toBe(result.pageId)
    const text = JSON.stringify(result.scene.root)
    expect(text).toContain('Pricing')
  })

  it('returns page-not-found for unknown pageId', async () => {
    const scene = minimalScene()
    const result = await applyHtmlImport(scene, {
      html: '<p>Hi</p>',
      pageId: 'missing-page',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('page-not-found')
  })
})

describe('HTML-to-Scene Import P2 Fidelity', () => {
  it('extracts background-image url and surface background properties onto containers', async () => {
    const html = `
      <section style="background-image: url('https://images.unsplash.com/photo-banner.jpg'); background-size: cover; background-position: center; background-repeat: no-repeat; padding: 48px;">
        <h1>Hero with Banner</h1>
      </section>
    `
    const res = await htmlToSceneRoot(html)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const section = res.root.children?.[0] ?? res.root
    expect(section.props?.backgroundImage).toBe('https://images.unsplash.com/photo-banner.jpg')
    expect(section.props?.backgroundSize).toBe('cover')
    expect(section.props?.backgroundPosition).toBe('center')
    expect(section.props?.backgroundRepeat).toBe('no-repeat')
  })

  it('converts rem gap to pixel dimensions', async () => {
    const html = `
      <div style="display: flex; gap: 1.5rem;">
        <span>Item 1</span>
        <span>Item 2</span>
      </div>
    `
    const res = await htmlToSceneRoot(html)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const container = res.root.children?.[0] ?? res.root
    expect(container.props?.gap).toBe('24px')
  })

  it('maps flexWrap, flexGrow, and flexShrink on flex containers and children', async () => {
    const html = `
      <div style="display: flex; flex-wrap: wrap; gap: 16px;">
        <div style="flex-grow: 1; flex-shrink: 0; width: 200px;">Card 1</div>
        <div style="flex-grow: 2; width: 200px;">Card 2</div>
      </div>
    `
    const res = await htmlToSceneRoot(html)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const container = res.root.children?.[0] ?? res.root
    expect(container.style?.flexWrap).toBe('wrap')
    const firstChild = container.children?.[0]
    expect(firstChild?.style?.flexGrow).toBe(1)
    expect(firstChild?.style?.flexShrink).toBe(0)
  })

  it('preserves child SiteSvg vector inside SiteButton', async () => {
    const html = `
      <button style="display: flex; align-items: center; gap: 8px;">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        <span>Continue</span>
      </button>
    `
    const res = await htmlToSceneRoot(html)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    // Find the SiteButton
    let btn: any = null
    const findBtn = (n: any) => {
      if (n.type === 'SiteButton') btn = n
      for (const c of n.children ?? []) findBtn(c)
    }
    findBtn(res.root)

    expect(btn).toBeDefined()
    expect(btn.children?.length).toBeGreaterThanOrEqual(1)
    const svgChild = btn.children?.find((c: any) => c.type === 'SiteSvg')
    expect(svgChild).toBeDefined()
    expect(svgChild.props?.viewBox).toBe('0 0 24 24')
    expect(svgChild.props?.markup).toContain('<path')
  })

  it('tightens inherited body line-height on display headlines', async () => {
    const html = `
<style>
  body { font-size: 16px; line-height: 1.6; font-family: "Noto Sans", sans-serif; }
  h1 { font-size: 64px; color: #fff; }
</style>
<body>
  <h1>Intelligenz. Für jede digitale Entscheidung.</h1>
</body>
`
    const res = await htmlToSceneRoot(html)
    expect(res.ok).toBe(true)
    if (!res.ok) return
    let display: SceneNode | null = null
    walk(res.root, (n) => {
      if (n.type === 'SiteText' && n.props?.role === 'display') display = n
    })
    expect(display).toBeTruthy()
    expect(String(display!.props?.lineHeight)).toBe('1.08')
    expect(String(display!.props?.letterSpacing)).toBe('-0.02em')
  })
})

