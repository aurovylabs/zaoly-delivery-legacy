'use client'

import { Button } from '@zaoly/ui'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { COMPARE_PROFILES } from '../lib/landing/compare'
import { LANDING_EXAMPLE_COMPOSITION } from '../lib/landing/example-composition'
import { communityGithubUrl, paths } from '../lib/paths'
import { siteText } from '../lib/public-site-locale'
import { useUserPrefs } from '../lib/user-prefs'
import { LandingExperience } from './landing-experience'
import { ZaolySealMark } from './zaoly-seal-mark'

const sectionHref = (id: string) => `${paths.routes.home}#${id}`

function Brand() {
  return <span className="zl-brand"><ZaolySealMark size={34} /><span>Zaoly</span></span>
}

function Index({ children }: { children: ReactNode }) {
  return <span className="zl-index">{children}</span>
}

function CodeLines({ locale }: { locale: 'de' | 'en' }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  const example = LANDING_EXAMPLE_COMPOSITION
  return (
    <pre className="zl-code-lines" aria-label={t('Beispiel eines exportierten React-Moduls', 'Example of an exported React module')}><code>
      <span><i>01</i><b>import</b> {'{'} Stack, Text, Button {'}'}</span>
      <span><i>02</i><b>from</b> <em>&apos;@zaoly/site-kit&apos;</em></span>
      <span><i>03</i></span>
      <span><i>04</i><b>export function</b> {example.name}() {'{'}</span>
      <span><i>05</i>  <b>return</b> (</span>
      <span><i>06</i>    &lt;Stack&gt;</span>
      <span><i>07</i>      &lt;Text&gt;{t('Eine Idee. Viele Orte.', 'One idea. Many places.')}&lt;/Text&gt;</span>
      <span><i>08</i>      &lt;Button&gt;{t('Entdecken', 'Explore')}&lt;/Button&gt;</span>
      <span><i>09</i>    &lt;/Stack&gt;</span>
      <span><i>10</i>  )</span>
      <span><i>11</i>{'}'}</span>
    </code></pre>
  )
}

export function LandingPage({ contactEmail = paths.publicSiteContactEmailDefault }: { contactEmail?: string | null }) {
  const { product, compare, kit, tokens, workflow, contact } = paths.landing.sections
  const { locale, setLocale } = useUserPrefs()
  const router = useRouter()
  const t = (de: string, en: string) => siteText(locale, de, en)

  return (
    <main className="zl">
      <a className="zl-skip" href={sectionHref(product)}>{t('Zum Inhalt springen', 'Skip to content')}</a>

      <header className="zl-header">
        <div className="zl-shell zl-header__inner">
          <a className="zl-header__brand" href={paths.routes.home} aria-label={t('Zaoly Startseite', 'Zaoly home')}><Brand /></a>
          <nav className="zl-nav" aria-label={t('Landingpage Navigation', 'Landing page navigation')}>
            <a href={sectionHref(product)}>{t('Produkt', 'Product')}</a>
            <a href={sectionHref(compare)}>{t('Vergleich', 'Compare')}</a>
            <a href={sectionHref(kit)}>{t('Kit · Demo', 'Kit · Demo')}</a>
            <a href={sectionHref(tokens)}>{t('Tokens · Demo', 'Tokens · Demo')}</a>
            <a href={paths.routes.explore}>{t('Explore · Demos', 'Explore · Demos')}</a>
            <a href={paths.routes.faq}>FAQ</a>
            <a href={sectionHref(contact)}>{t('Kontakt', 'Contact')}</a>
          </nav>
          <div className="zl-header__actions">
            <div className="zl-language" role="group" aria-label={t('Sprache wählen', 'Choose language')}>
              {(['de', 'en'] as const).map((choice) => <button key={choice} type="button" lang={choice} aria-pressed={locale === choice} onClick={() => { setLocale(choice); router.refresh() }}>{choice.toUpperCase()}</button>)}
            </div>
            <a href={paths.routes.login}>{t('Anmelden', 'Sign in')}</a>
            <Button href={paths.routes.register} size="sm" className="zl-header__button">{t('Loslegen', 'Get started')} <span aria-hidden="true">↗</span></Button>
          </div>
        </div>
      </header>

      <section className="zl-hero" aria-labelledby="zl-hero-title">
        <div className="zl-shell zl-hero__intro">
          <div className="zl-hero__eyebrow">{t('VISUELLES DESIGN / ECHTER CODE', 'VISUAL DESIGN / REAL CODE')}</div>
          <h1 id="zl-hero-title">{locale === 'de' ? <><span>Vom Design </span><span>zur <em>echten</em> </span><span>Komponente.</span></> : <><span>From design </span><span>to <em>real</em> </span><span>components.</span></>}</h1>
          <div className="zl-hero__bottom">
            <p>{t('Gestalte auf dem Canvas. Baue mit dem Zaoly Kit. Übergib React-Komponenten, die dein Team in anderen Produkten einsetzen kann.', 'Design on the canvas. Build with Zaoly Kit. Hand off React components your team can use in other products.')}</p>
            <div className="zl-hero__actions">
              <Button href={paths.routes.register} size="lg" className="zl-hero__cta">{t('Loslegen', 'Get started')} <span aria-hidden="true">↗</span></Button>
              <a className="zl-arrow-link" href={paths.routes.login}>{t('Anmelden', 'Sign in')} <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>

        <div className="zl-stage" data-loop="canvas" role="img" aria-label={t('Animation: auf dem Canvas wird eine Komponente ausgewählt und als React-Modul sichtbar', 'Animation: select a component on the canvas and see it appear as a React module')}>
          <div className="zl-stage__inner">
            <div className="zl-stage__canvas" aria-hidden="true">
              <div className="zl-stage__window"><span><b /> ZAOLY / EDITOR</span><span>STUDIO FORM / PAGE 01</span><span>◇</span></div>
              <div className="zl-stage__body">
                <div className="zl-stage__rail"><span>▦</span><span>◇</span><span>≡</span><span>◈</span></div>
                <div className="zl-stage__art"><div className="zl-stage__artboard"><img src={paths.landing.assets.heroArtboard} width="760" height="620" alt="" /><span className="zl-stage__focus" aria-hidden="true" /></div></div>
                <div className="zl-stage__inspect"><span>INSPECT</span><strong>{LANDING_EXAMPLE_COMPOSITION.name}</strong><small>{locale === 'de' ? LANDING_EXAMPLE_COMPOSITION.labelDe : LANDING_EXAMPLE_COMPOSITION.labelEn}</small><small>VARIANT</small><b className="zl-stage__variant-value"><span>Default</span><span>Primary</span></b><small>TOKEN</small><b>Primary</b></div>
              </div>
            </div>
            <div className="zl-stage__code" aria-hidden="true">
              <div className="zl-stage__code-head"><span>{LANDING_EXAMPLE_COMPOSITION.fileName}</span><span className="zl-stage__code-variant">Primary</span></div>
              <code><span>import</span> {'{'} Stack, Text, Button {'}'}</code>
              <code><span>from</span> &apos;@zaoly/site-kit&apos;</code>
              <code className="zl-stage__code-gap">&nbsp;</code>
              <code><span>export function</span> {LANDING_EXAMPLE_COMPOSITION.name}() {'{'}</code>
              <code>&nbsp; return &lt;Stack&gt;...&lt;/Stack&gt;</code>
              <code>{'}'}</code>
            </div>
          </div>
        </div>
      </section>

      <section className="zl-compare" id={compare} aria-labelledby="zl-compare-title">
        <div className="zl-shell">
          <div className="zl-compare__intro">
            <Index>{t('ORIENTIERUNG', 'ORIENTATION')}</Index>
            <h2 id="zl-compare-title">
              {locale === 'de' ? <>Warum Zaoly.<br /><em>Und wann die anderen.</em></> : <>Why Zaoly.<br /><em>And when the others.</em></>}
            </h2>
            <p>
              {t(
                'Eine Tabelle: Job, Vorteile, Nachteile — mit klarem Blick darauf, wo Zaoly für Design → React-Baustein gewinnt.',
                'One table: job, pros, cons — with a clear view of where Zaoly wins for design → React building block.',
              )}
            </p>
          </div>
          <div className="zl-compare__scroll">
            <table className="zl-compare__table">
              <caption className="visually-hidden">
                {t(
                  'Vergleichstabelle: Zaoly, Figma, Framer, Penpot, Sketch und Webflow mit Job, Vorteilen und Nachteilen',
                  'Comparison table: Zaoly, Figma, Framer, Penpot, Sketch, and Webflow with job, pros, and cons',
                )}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t('Kriterium', 'Criterion')}</th>
                  {COMPARE_PROFILES.map((profile) => (
                    <th key={profile.id} scope="col" className={profile.highlight ? 'is-zaoly' : undefined}>
                      {profile.name}
                      {profile.highlight ? (
                        <span className="zl-compare__th-note">{t('Baustein', 'Building block')}</span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{t('Job', 'Job')}</th>
                  {COMPARE_PROFILES.map((profile) => (
                    <td key={profile.id} className={profile.highlight ? 'is-zaoly' : undefined}>
                      {locale === 'de' ? profile.job.de : profile.job.en}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t('Vorteile', 'Pros')}</th>
                  {COMPARE_PROFILES.map((profile) => (
                    <td key={profile.id} className={profile.highlight ? 'is-zaoly' : undefined}>
                      <ul>
                        {profile.pros.map((line) => (
                          <li key={line.en}>{locale === 'de' ? line.de : line.en}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t('Nachteile', 'Cons')}</th>
                  {COMPARE_PROFILES.map((profile) => (
                    <td key={profile.id} className={profile.highlight ? 'is-zaoly' : undefined}>
                      <ul>
                        {profile.cons.map((line) => (
                          <li key={line.en}>{locale === 'de' ? line.de : line.en}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t('Am besten, wenn', 'Best when')}</th>
                  {COMPARE_PROFILES.map((profile) => (
                    <td key={profile.id} className={profile.highlight ? 'is-zaoly' : undefined}>
                      {locale === 'de' ? profile.pickWhen.de : profile.pickWhen.en}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="zl-compare__note">
            {t(
              'Zaoly will Figma nicht als Design-OS und Framer/Webflow nicht als Site-Publisher ersetzen — sondern den Schritt, in dem aus Design ein React-Baustein in eurem Produkt wird.',
              'Zaoly isn’t trying to replace Figma as a design OS or Framer/Webflow as a site publisher — it owns the step where design becomes a React building block in your product.',
            )}
          </p>
        </div>
      </section>

      <section className="zl-manifesto" id={product} aria-labelledby="zl-manifesto-title">
        <div className="zl-shell">
          <Index>{t('WARUM ZAOLY', 'WHY ZAOLY')}</Index>
          <h2 id="zl-manifesto-title">{locale === 'de' ? <>Weniger <em>nachbauen.</em>{' '}<br />Mehr weiterverwenden.</> : <>Less <em>rebuilding.</em>{' '}<br />More reuse.</>}</h2>
          <div className="zl-manifesto__bottom"><p>{t('Zaoly macht aus visuellen Entscheidungen strukturierte Bausteine: mit Varianten, Markentokens und Code. Damit Design und Entwicklung am selben Ergebnis weiterarbeiten können.', 'Zaoly turns visual decisions into structured building blocks with variants, design tokens, and code, so design and development can keep working from the same source.')}</p></div>
          <div className="zl-manifesto__rail" aria-label={t('Design wird zur Komponente und zum Produkt', 'Design becomes a component and a product')}><span>DESIGN</span><b>→</b><span>{t('KOMPONENTE', 'COMPONENT')}</span><b>→</b><span>{t('PRODUKT', 'PRODUCT')}</span></div>
        </div>
      </section>

      <LandingExperience locale={locale} sectionIds={{ kit, tokens, workflow }} />

      <section className="zl-proof" aria-labelledby="zl-proof-title">
        <div className="zl-shell">
          <div className="zl-proof__intro">
            <Index>{t('EINBLICK IN ZAOLY', 'INSIDE ZAOLY')}</Index>
            <h2 id="zl-proof-title">{locale === 'de' ? <>Das System.<br /><em>In der Anwendung.</em></> : <>The system.<br /><em>At work.</em></>}</h2>
            <p>{t('Drei echte Ansichten mit Demodaten — kein Mockup, kein Suite-Zwang.', 'Three real views with sample data — no mockup, no suite requirement.')}</p>
          </div>
          <div className="zl-proof__grid">
            <figure className="zl-proof__figure">
              <div className="zl-proof__image zl-proof__image--tokens">
                <img src={paths.landing.assets.tokenStudioApp} width="1280" height="720" loading="lazy" alt={t('Echte Zaoly Token-Studio-Ansicht mit Farbtokens des lokalen Seed-Packs', 'Zaoly Token Studio app view showing color tokens from the local seed pack')} />
              </div>
              <figcaption><strong>Token Studio</strong><span>{t('Echte App-Ansicht · Demodaten', 'Actual app view · sample data')}</span></figcaption>
              <p>{t('Pfade verbinden Werte und Komponenten im Editor.', 'Token paths connect values to components in the editor.')}</p>
            </figure>
            <figure className="zl-proof__figure">
              <div className="zl-proof__image zl-proof__image--kit">
                <img src={paths.landing.assets.kitPlaygroundApp} width="1320" height="420" loading="lazy" alt={t('Echtes Zaoly Kit Playground mit Komponentenliste, TSX-Code, Live Preview und Token-Panel', 'Zaoly Kit Playground showing a component list, TSX code, live preview, and token panel')} />
              </div>
              <figcaption><strong>Zaoly Kit Playground</strong><span>{t('Echte App-Ansicht · Demodaten', 'Actual app view · sample data')}</span></figcaption>
              <p>{t('Kit-Atome, TSX und Live Preview stehen nebeneinander.', 'Kit atoms, TSX, and live preview sit side by side.')}</p>
            </figure>
            <figure className="zl-proof__figure">
              <div className="zl-proof__image zl-proof__image--breakpoints">
                <img src={paths.landing.assets.editorBreakpointsApp} width="1024" height="651" loading="lazy" alt={t('Echter Zaoly Editor mit Desktop-, Tablet- und Mobile-Artboards derselben Seite nebeneinander', 'Zaoly editor showing the same page on desktop, tablet, and mobile artboards side by side')} />
              </div>
              <figcaption><strong>{t('Multi-Breakpoint', 'Multi-breakpoint')}</strong><span>{t('Echte App-Ansicht · Demodaten', 'Actual app view · sample data')}</span></figcaption>
              <p>{t('Multi-Breakpoint Compare auf dem Canvas.', 'Multi-breakpoint compare on the canvas.')}</p>
            </figure>
          </div>
        </div>
      </section>

      <section className="zl-projects" aria-labelledby="zl-projects-title"><div className="zl-shell">
        <div className="zl-projects__intro"><Index>{t('PROJEKTE', 'PROJECTS')}</Index><h2 id="zl-projects-title">{locale === 'de' ? <>Ein Baustein.{' '}<br /><em>So viele Projekte,</em>{' '}<br />wie du brauchst.</> : <>One building block.{' '}<br /><em>As many projects</em>{' '}<br />as you need.</>}</h2><p>{t('Deine Projekte haben unterschiedliche Ziele. Gute Komponenten können trotzdem in mehr als einem Kontext weiterleben.', 'Your projects have different goals. Well-made components can still live on in more than one context.')}</p></div>
        <div className="zl-projects__mosaic" data-loop="projects" aria-label={t('Eine Komponente in drei verschiedenen Projekten', 'One component across three different projects')}>
          <article className="zl-project zl-project--studio"><div className="zl-project__sample"><span className="zl-project__glyph">◇</span><strong>{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</strong><span>{t('Ein Modul für Geschichten.', 'A module for stories.')}</span><em className="zl-project__context">{t('Landing', 'Landing')}</em></div><span className="zl-project__name">Studio Form</span></article>
          <article className="zl-project zl-project--product"><div className="zl-project__sample"><span className="zl-project__glyph">◇</span><strong>{locale === 'de' ? <>Alles im<br />Blick.</> : <>Everything<br />in view.</>}</strong><span>{t('Dieselbe Struktur. Neuer Kontext.', 'Same structure. New context.')}</span><em className="zl-project__context">{t('Dashboard', 'Dashboard')}</em></div><span className="zl-project__name">Product</span></article>
          <article className="zl-project zl-project--platform"><div className="zl-project__sample"><span className="zl-project__glyph">◇</span><strong>{locale === 'de' ? <>Einfach<br />weiter.</> : <>Ready to<br />move on.</>}</strong><span>{t('Bereit für das nächste Produkt.', 'Ready for the next product.')}</span><em className="zl-project__context">{t('App-Shell', 'App shell')}</em></div><span className="zl-project__name">Platform</span></article>
        </div>
        <p className="zl-projects__cta">
          <a className="zl-arrow-link" href={paths.routes.register}>
            {t('Eigenes Projekt starten', 'Start your own project')} <span aria-hidden="true">↗</span>
          </a>
        </p>
      </div></section>

      <section className="zl-handoff" aria-labelledby="zl-handoff-title"><div className="zl-shell">
        <div className="zl-handoff__intro"><Index>DESIGN → DEV</Index><h2 id="zl-handoff-title">{locale === 'de' ? <>Übergabe{' '}<br /><em>ohne Ratespiel.</em></> : <>Handoff{' '}<br /><em>without guesswork.</em></>}</h2><p>{t('Aus dem visuellen Baustein wird ein React-Modul mit Import, Tokenkontext und Hinweisen für die Integration in andere React-Projekte.', 'Turn a visual building block into a React module with imports, token context, and guidance for integration into other React projects.')}</p></div>
        <div className="zl-handoff__proof" data-loop="handoff"><div className="zl-handoff__preview"><div className="zl-handoff__panel-head">{t('Visuelle Komponente', 'Visual component')} · {locale === 'de' ? LANDING_EXAMPLE_COMPOSITION.labelDe : LANDING_EXAMPLE_COMPOSITION.labelEn}</div><div className="zl-handoff__visual-card"><strong>{locale === 'de' ? <>Eine Idee.<br /><em>Viele Orte.</em></> : <>One idea.<br /><em>Many places.</em></>}</strong><span className="zl-handoff__visual-button">{t('Entdecken', 'Explore')} ↗</span><i aria-hidden="true">◇</i></div><p className="zl-example-note">{locale === 'de' ? LANDING_EXAMPLE_COMPOSITION.noteDe : LANDING_EXAMPLE_COMPOSITION.noteEn}</p></div><div className="zl-handoff__export"><div className="zl-handoff__panel-head">React module</div><CodeLines locale={locale} /><div className="zl-handoff__ready" aria-hidden="true"><span>✓</span> {t('Bereit für React', 'Ready for React')}</div></div></div>
      </div></section>

      <section className="zl-contact" id={contact} aria-labelledby="zl-contact-title">
        <div className="zl-shell zl-contact__layout">
          <div className="zl-contact__heading"><Index>{t('KONTAKT', 'CONTACT')}</Index><h2 id="zl-contact-title">{locale === 'de' ? <>Lass uns über<br /><em>Zaoly sprechen.</em></> : <>Let’s talk about<br /><em>Zaoly.</em></>}</h2></div>
          <div className="zl-contact__copy">
            <p>{t('Du planst den Einsatz im Team, möchtest mehr über Hosting und AI-Funktionen erfahren oder hast Fragen zum Entwickler-Handoff? Wir helfen dir, den passenden nächsten Schritt zu finden.', 'Planning a team rollout, want to learn about hosting and AI features, or have questions about developer handoff? We’ll help you find the right next step.')}</p>
            <div className="zl-contact__actions">
              {contactEmail ? <a className="zl-contact__primary" href={`mailto:${contactEmail}?subject=${encodeURIComponent(t('Anfrage zu Zaoly', 'Zaoly enquiry'))}`}>{t('Gespräch anfragen', 'Talk to our team')} <span aria-hidden="true">↗</span></a> : <a className="zl-contact__primary" href={paths.routes.faq}>{t('Produktfragen ansehen', 'Explore product FAQs')} <span aria-hidden="true">↗</span></a>}
              <a className="zl-contact__secondary" href={paths.routes.register}>{t('Loslegen', 'Get started')}</a>
            </div>
            {contactEmail ? <a className="zl-contact__email" href={`mailto:${contactEmail}`}>{contactEmail}</a> : <p className="zl-contact__note">{t('Für direkte Anfragen ergänzen wir hier die offizielle Kontaktadresse.', 'The official contact address will appear here once configured.')}</p>}
          </div>
        </div>
      </section>

      <section className="zl-end" aria-labelledby="zl-end-title"><div className="zl-shell"><h2 id="zl-end-title">{locale === 'de' ? <>Mach aus deinem{' '}<br />nächsten Entwurf{' '}<br /><em>mehr.</em></> : <>Make more of{' '}<br />your next{' '}<br /><em>design.</em></>}</h2><div className="zl-end__bottom"><p>{t('Gestalte heute, was morgen als Komponente weiterarbeitet.', 'Design today what keeps working as a component tomorrow.')}</p><Button href={paths.routes.register} size="lg" className="zl-end__cta">{t('Loslegen', 'Get started')} <span aria-hidden="true">↗</span></Button></div></div></section>

      <footer className="zl-footer"><div className="zl-shell zl-footer__inner"><Brand /><nav aria-label={t('Footer Navigation', 'Footer navigation')}><a href={paths.routes.register}>{t('Loslegen', 'Get started')}</a><a href={paths.routes.explore}>{t('Explore · Demos', 'Explore · Demos')}</a><a href={paths.routes.kit}>{t('Kit Playground (App)', 'Kit Playground (App)')}</a><a href={paths.routes.tokens}>{t('Token Studio (App)', 'Token Studio (App)')}</a><a href={paths.routes.faq}>FAQ</a><a href={sectionHref(contact)}>{t('Kontakt', 'Contact')}</a><a href={communityGithubUrl()} target="_blank" rel="noopener noreferrer">GitHub</a><a href={paths.routes.login}>{t('Anmelden', 'Sign in')}</a></nav></div></footer>
    </main>
  )
}
