// @vitest-environment jsdom
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LandingPage } from '../components/landing-page'
import { UserPrefsProvider } from '../lib/user-prefs'
import { communityGithubUrl, paths } from '../lib/paths'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

describe('Zaoly landing page', () => {
  const renderLanding = (locale: 'de' | 'en' = 'de') => render(<UserPrefsProvider initialLocale={locale}><LandingPage /></UserPrefsProvider>)

  it('shows a short design-to-component story with an interactive experience stage', () => {
    renderLanding()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Vom Design zur echten Komponente.',
    )
    expect(screen.getByRole('heading', { name: /Warum Zaoly.*wann die anderen/i })).toBeInTheDocument()
    expect(document.getElementById(paths.landing.sections.compare)).toBeTruthy()
    expect(screen.getByRole('link', { name: /^Vergleich$/i })).toHaveAttribute(
      'href',
      `${paths.routes.home}#${paths.landing.sections.compare}`,
    )
    const compare = screen.getByRole('table')
    expect(within(compare).getByRole('columnheader', { name: /Zaoly/i })).toBeInTheDocument()
    expect(within(compare).getByRole('columnheader', { name: 'Figma' })).toBeInTheDocument()
    expect(within(compare).getByRole('columnheader', { name: 'Webflow' })).toBeInTheDocument()
    expect(within(compare).getByRole('rowheader', { name: /^Vorteile$/i })).toBeInTheDocument()
    expect(within(compare).getByRole('rowheader', { name: /^Nachteile$/i })).toBeInTheDocument()
    expect(within(compare).getByText(/^Baustein$/i)).toBeInTheDocument()
    expect(screen.getByText(/will Figma nicht als Design-OS/i)).toBeInTheDocument()
    // Compare sits on `/` directly under the hero, before the manifesto thesis.
    const hero = screen.getByRole('heading', { level: 1 })
    const compareHeading = screen.getByRole('heading', { name: /Warum Zaoly.*wann die anderen/i })
    const manifesto = screen.getByRole('heading', { name: /Weniger nachbauen/i })
    expect(
      hero.compareDocumentPosition(compareHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      compareHeading.compareDocumentPosition(manifesto) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Nicht lesen.*Ausprobieren/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Das System.*In der Anwendung/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Übergabe ohne Ratespiel/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /So viele Projekte, wie du brauchst/i })).toBeInTheDocument()

    const tabs = screen.getByRole('tablist', { name: /Produktkapitel/i })
    expect(tabs.querySelectorAll('[role="tab"]')).toHaveLength(5)
    expect(screen.getByRole('tab', { name: 'Zaoly Kit' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Token Studio' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Kit · Demo/i })).toHaveAttribute(
      'href',
      `${paths.routes.home}#${paths.landing.sections.kit}`,
    )
    expect(screen.getByRole('link', { name: /Tokens · Demo/i })).toHaveAttribute(
      'href',
      `${paths.routes.home}#${paths.landing.sections.tokens}`,
    )
    expect(screen.getAllByText(/Beispiel-Master/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Marketing-Beispiel · kein Seed-Atom/i)).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Workflow' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Weg' })).toBeInTheDocument()

    expect(document.getElementById(paths.landing.sections.kit)).toBeTruthy()
    expect(document.getElementById(paths.landing.sections.tokens)).toBeTruthy()
    expect(document.getElementById(paths.landing.sections.workflow)).toBeTruthy()

    expect(screen.getAllByRole('link', { name: /Loslegen/i })[0]).toHaveAttribute(
      'href',
      paths.routes.register,
    )
    expect(screen.getByRole('link', { name: /App · Editor \(Login\)/i })).toHaveAttribute(
      'href',
      paths.routes.editor,
    )
    expect(screen.getByRole('link', { name: /Demo · Editor vertiefen/i })).toHaveAttribute(
      'href',
      paths.routes.exploreChapter('editor'),
    )
    expect(screen.getAllByRole('link', { name: /Explore · Demos/i })[0]).toHaveAttribute(
      'href',
      paths.routes.explore,
    )
    expect(screen.getByRole('navigation', { name: /Footer/i }).querySelector(`a[href="${paths.routes.kit}"]`)).toHaveTextContent(
      /Kit Playground \(App\)/i,
    )
    const mosaic = screen.getByLabelText(/Eine Komponente in drei verschiedenen Projekten/i)
    expect(within(mosaic).queryByText(/↗/)).not.toBeInTheDocument()
    expect(within(mosaic).getByText(/^Landing$/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Eigenes Projekt starten/i })).toHaveAttribute(
      'href',
      paths.routes.register,
    )
    expect(screen.getByRole('navigation', { name: /Footer/i }).querySelector(`a[href="${paths.routes.tokens}"]`)).toHaveTextContent(
      /Token Studio \(App\)/i,
    )
    expect(screen.getByRole('navigation', { name: /Landingpage/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'FAQ' })[0]).toHaveAttribute('href', paths.routes.faq)
    const github = screen.getByRole('navigation', { name: /Footer/i }).querySelector('a[href*="github.com"]')
    expect(github).toHaveAttribute('href', communityGithubUrl())
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(communityGithubUrl()).toBe(`https://github.com/${paths.communityGithubRepo}`)
    expect(paths.communityGithubRepo).toBe('aurovylabs/zaoly-delivery')
    expect(screen.getByRole('img', { name: /Canvas wird eine Komponente ausgewählt/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Eine Komponente in drei verschiedenen Projekten/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Beispiel eines exportierten React-Moduls/i)).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/Plexon Collection/i)
    expect(document.body).not.toHaveTextContent(/Werte formen/)
    expect(document.body).not.toHaveTextContent(/Schrift ändern/)
  })

  it('keeps compact interactions on home and deep-links to explore', async () => {
    const user = userEvent.setup()
    renderLanding()

    expect(document.querySelector('.zl-experience--compact')).toBeTruthy()
    const editor = screen.getByRole('group', { name: /Interaktive Editor-Illustration/i })
    expect(editor).toHaveAttribute('data-density', 'compact')
    expect(within(editor).getByText(/Illustration · nicht der Live-Editor/i)).toBeInTheDocument()
    expect(within(editor).getByRole('tab', { name: 'Canvas' })).toHaveAttribute('aria-selected', 'true')
    expect(within(editor).getByRole('tab', { name: 'Masters' })).toBeInTheDocument()
    expect(within(editor).getByRole('tab', { name: 'Preflight' })).toBeInTheDocument()
    await user.click(within(editor).getByRole('button', { name: /Projekt entdecken/i }))
    expect(editor).toHaveAttribute('data-focus', 'button')
    await user.click(within(editor).getByRole('button', { name: /^▣\s*Contact$/i }))
    expect(editor).toHaveAttribute('data-page', 'contact')
    expect(within(editor).queryByRole('button', { name: '125%' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Demo · Editor vertiefen/i })).toHaveAttribute('href', paths.routes.exploreChapter('editor'))

    await user.click(screen.getByRole('tab', { name: 'Zaoly Kit' }))
    const kit = screen.getByRole('group', { name: /Interaktives Zaoly Kit/i })
    expect(kit).toHaveAttribute('data-density', 'compact')
    expect(kit).toHaveAttribute('data-step', 'content')
    await user.click(within(kit).getByRole('button', { name: 'Button' }))
    expect(kit).toHaveAttribute('data-atom', 'Button')
    await user.click(within(kit).getByRole('tab', { name: /^Seite$/i }))
    expect(kit).toHaveAttribute('data-step', 'page')
    expect(within(kit).getByText(/vollständige Seiten|Full pages/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Demo · Kit vertiefen/i })).toHaveAttribute('href', paths.routes.exploreChapter('kit'))
    expect(screen.getByRole('link', { name: /App · Kit Playground \(Login\)/i })).toHaveAttribute('href', paths.routes.kit)

    await user.click(screen.getByRole('tab', { name: 'Token Studio' }))
    const tokens = screen.getByRole('group', { name: /Interaktives Token Studio/i })
    await user.click(within(tokens).getByRole('button', { name: /Farbe/i }))
    expect(tokens).toHaveAttribute('data-catalog', 'color')
    expect(within(tokens).queryByRole('button', { name: /Teal/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Demo · Tokens vertiefen/i })).toHaveAttribute('href', paths.routes.exploreChapter('tokens'))

    await user.click(screen.getByRole('tab', { name: 'Screens' }))
    const breaks = screen.getByRole('group', { name: /Interaktive Breakpoint-Illustration/i })
    await user.click(screen.getByRole('button', { name: /^Mobile$/ }))
    expect(breaks).toHaveAttribute('data-break', 'mobile')
    expect(screen.queryByRole('button', { name: /^Tablet$/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Demo · Screens vertiefen/i })).toHaveAttribute('href', paths.routes.exploreChapter('screens'))

    await user.click(screen.getByRole('tab', { name: 'Weg' }))
    const pathStage = screen.getByRole('group', { name: /Interaktiver Workflow/i })
    await user.click(within(pathStage).getByRole('button', { name: /Nächsten Workflow-Schritt/i }))
    expect(pathStage).toHaveAttribute('data-step', 'system')
    expect(within(pathStage).queryByRole('button', { name: /Auto abspielen/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Demo · Weg vertiefen/i })).toHaveAttribute('href', paths.routes.exploreChapter('path'))
    expect(screen.getAllByRole('link', { name: /Explore · Demos/i })[0]).toHaveAttribute('href', paths.routes.explore)
  })

  it('plays and stops the short compact experience tour', () => {
    vi.useFakeTimers()
    renderLanding()

    fireEvent.click(screen.getByRole('button', { name: /Tour abspielen/i }))
    expect(screen.getByRole('button', { name: /Tour stoppen/i })).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('.zl-experience')).toHaveAttribute('data-playing', 'true')
    expect(screen.getByText(/Tour 1\/12/)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Interaktive Editor-Illustration/i })).toHaveAttribute('data-mode', 'design')

    act(() => {
      vi.advanceTimersByTime(1600)
    })
    expect(screen.getByText(/Tour 2\/12/)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Interaktive Editor-Illustration/i })).toHaveAttribute('data-mode', 'system')

    fireEvent.click(screen.getByRole('button', { name: /Tour stoppen/i }))
    expect(screen.getByRole('button', { name: /Tour abspielen/i })).toHaveAttribute('aria-pressed', 'false')
    expect(document.querySelector('.zl-experience')).not.toHaveAttribute('data-playing')
    vi.useRealTimers()
  })

  it('renders the full public landing entry in English', () => {
    renderLanding('en')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('From design to real components.')
    expect(screen.getAllByRole('link', { name: 'Sign in' }).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByRole('link', { name: /Get started/i })[0]).toHaveAttribute(
      'href',
      paths.routes.register,
    )
    expect(screen.getByRole('heading', { name: /Don’t just read.*Try it/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Let’s talk about/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Talk to our team/i })).toHaveAttribute('href', `mailto:${paths.publicSiteContactEmailDefault}?subject=Zaoly%20enquiry`)
  })

  it('uses the configured contact inbox and never invents one', () => {
    render(<UserPrefsProvider initialLocale="de"><LandingPage contactEmail="team@example.org" /></UserPrefsProvider>)
    expect(screen.getByRole('link', { name: /Gespräch anfragen/i })).toHaveAttribute('href', 'mailto:team@example.org?subject=Anfrage%20zu%20Zaoly')
  })

  it('uses the first-party illustration and genuine app screenshot assets listed in paths', () => {
    renderLanding()
    const hero = document.querySelector(`img[src="${paths.landing.assets.heroArtboard}"]`)
    const tokenScreenshot = screen.getByRole('img', { name: /Echte Zaoly Token-Studio-Ansicht/i })
    const kitScreenshot = screen.getByRole('img', { name: /Echtes Zaoly Kit Playground/i })
    const breakpointShots = screen.getAllByRole('img', {
      name: /Desktop., Tablet. und Mobile/i,
      hidden: true,
    })
    expect(hero).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Interaktives Zaoly Kit/i, hidden: true })).toHaveAttribute('data-step', 'content')
    expect(tokenScreenshot).toHaveAttribute('src', paths.landing.assets.tokenStudioApp)
    expect(kitScreenshot).toHaveAttribute('src', paths.landing.assets.kitPlaygroundApp)
    expect(breakpointShots.length).toBeGreaterThanOrEqual(1)
    expect(breakpointShots[0]).toHaveAttribute('src', paths.landing.assets.editorBreakpointsApp)
    expect(screen.getAllByText('Echte App-Ansicht · Demodaten').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText(/Pfade verbinden Werte und Komponenten im Editor/i)).toBeInTheDocument()
    expect(screen.getByText(/Kit-Atome, TSX und Live Preview stehen nebeneinander/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Multi-Breakpoint Compare/i, { hidden: true }).length).toBeGreaterThanOrEqual(1)
    for (const asset of Object.values(paths.landing.assets)) {
      expect(existsSync(path.join(__dirname, '../public', asset.replace(/^\//, '')))).toBe(true)
    }
  })

  it('mounts interactive loops with reduced-motion fallbacks still defined', () => {
    renderLanding()

    expect(
      [...document.querySelectorAll('[data-loop]')].map((element) => element.getAttribute('data-loop')),
    ).toEqual(['canvas', 'editor', 'kit', 'tokens', 'breakpoints', 'workflow', 'projects', 'handoff'])
    expect(document.querySelector('.zl-editor-tour.is-interactive')).toBeTruthy()
    expect(document.querySelector('.zl-token-stage.is-interactive')).toBeTruthy()
    expect(document.querySelector('.zl-break-stage.is-interactive')).toBeTruthy()
    expect(document.querySelector('.zl-workflow__journey.is-interactive')).toBeTruthy()
    expect(document.querySelectorAll('.zl-kit-board__atom').length).toBeGreaterThanOrEqual(4)
    expect(screen.getByRole('button', { name: /Tour abspielen/i })).toBeInTheDocument()
    expect(document.querySelectorAll('.zl-workflow__chapter')).toHaveLength(3)
    expect(document.querySelector('.zl-workflow__journey')).toHaveTextContent('color.action.primary')
    expect(document.querySelector('.zl-workflow__journey')).toHaveTextContent('@zaoly/site-kit')
    expect(document.querySelector('.zl-handoff__ready')).toHaveTextContent('Bereit für React')
    expect(document.querySelector('.zl-token-stage')).toHaveTextContent('color.action.primary')
    expect(document.querySelectorAll('.zl-kit-board__atom').length).toBeGreaterThanOrEqual(4)
    expect(document.querySelector('.zl-editor-overview')).toBeFalsy()

    const css = readFileSync(path.join(__dirname, '../app/landing.css'), 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('.zl-experience__track')
    expect(css).toContain('.zl-experience--compact')
    expect(css).toContain('.zl-explore__grid')
    expect(css).toContain('.zl-proof__grid')
    expect(css).toContain('.zl-editor-tour.is-interactive')
    expect(document.querySelector('.zl-experience--compact')).toBeTruthy()
    expect(css).toContain('.zl-token-stage.is-interactive')
    expect(css).toContain('.zl-break-stage.is-interactive')
    expect(css).toContain('.zl-kit-board__grid')
    expect(css).toContain('.zl-experience__play')
    expect(css).toContain('.zl-token-stage__value-after, .zl-token-stage__complete { opacity: 1; }')
    expect(css).toContain('.zl-break-stage__mobile { opacity: 1; }')
    expect(css).toContain('.zl-editor-tour__pane--check, .zl-editor-tour__issue { opacity: 1; }')
    expect(css).toContain('.zl-workflow__chapter::before { background: var(--zl-acid); }')
    expect(css).toContain('.zl-experience__panel[hidden]')
  })
})
