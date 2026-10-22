'use client'

import { Button } from '@zaoly/ui'
import { useRouter } from 'next/navigation'
import { EXPLORE_CHAPTERS } from '../lib/landing/explore'
import { paths } from '../lib/paths'
import { siteText } from '../lib/public-site-locale'
import { useUserPrefs } from '../lib/user-prefs'
import { ZaolySealMark } from './zaoly-seal-mark'

const homeSection = (id: string) => `${paths.routes.home}#${id}`

function Brand() {
  return <span className="zl-brand"><ZaolySealMark size={34} /><span>Zaoly</span></span>
}

export function ExplorePage() {
  const { locale, setLocale } = useUserPrefs()
  const router = useRouter()
  const t = (de: string, en: string) => siteText(locale, de, en)

  return (
    <main className="zl zl-explore">
      <a className="zl-skip" href="#zl-explore-title">{t('Zum Inhalt springen', 'Skip to content')}</a>
      <header className="zl-header">
        <div className="zl-shell zl-header__inner">
          <a className="zl-header__brand" href={paths.routes.home} aria-label={t('Zaoly Startseite', 'Zaoly home')}><Brand /></a>
          <nav className="zl-nav" aria-label={t('Explore Navigation', 'Explore navigation')}>
            <a href={homeSection(paths.landing.sections.product)}>{t('Produkt', 'Product')}</a>
            <a href={paths.routes.explore} aria-current="page">{t('Explore', 'Explore')}</a>
            <a href={paths.routes.faq}>FAQ</a>
            <a href={homeSection(paths.landing.sections.contact)}>{t('Kontakt', 'Contact')}</a>
          </nav>
          <div className="zl-header__actions">
            <div className="zl-language" role="group" aria-label={t('Sprache wählen', 'Choose language')}>
              {(['de', 'en'] as const).map((choice) => (
                <button key={choice} type="button" lang={choice} aria-pressed={locale === choice} onClick={() => { setLocale(choice); router.refresh() }}>
                  {choice.toUpperCase()}
                </button>
              ))}
            </div>
            <a href={paths.routes.login}>{t('Anmelden', 'Sign in')}</a>
            <Button href={paths.routes.register} size="sm" className="zl-header__button">{t('Loslegen', 'Get started')} <span aria-hidden="true">↗</span></Button>
          </div>
        </div>
      </header>

      <section className="zl-explore__hero" aria-labelledby="zl-explore-title">
        <div className="zl-shell">
          <span className="zl-index">ZAOLY / EXPLORE</span>
          <h1 id="zl-explore-title">
            {locale === 'de' ? <>Produktmomente.<br /><em>Zum Anfassen.</em></> : <>Product moments.<br /><em>Hands-on.</em></>}
          </h1>
          <p className="zl-demo-badge" role="note">
            {t('Öffentliche Demos · kein Login', 'Public demos · no sign-in')}
          </p>
          <p>
            {t(
              'Fünf öffentliche Demos mit voller Interaktionsdichte. Die App-Hubs /editor, /kit und /tokens bleiben die Arbeitsflächen nach dem Start (Login).',
              'Five public demos with full interaction depth. The /editor, /kit, and /tokens hubs remain the working surfaces after you start (sign-in).',
            )}
          </p>
        </div>
      </section>

      <section className="zl-explore__grid-wrap" aria-label={t('Explore-Kapitel', 'Explore chapters')}>
        <div className="zl-shell zl-explore__grid">
          {EXPLORE_CHAPTERS.map((chapter, index) => (
            <a key={chapter.id} className="zl-explore__card" href={paths.routes.exploreChapter(chapter.id)}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{locale === 'de' ? chapter.labelDe : chapter.labelEn}</strong>
              <p>{locale === 'de' ? chapter.bodyDe : chapter.bodyEn}</p>
              <b>{t('Demo öffnen', 'Open demo')} ↗</b>
            </a>
          ))}
        </div>
      </section>

      <footer className="zl-footer">
        <div className="zl-shell zl-footer__inner">
          <Brand />
          <nav aria-label={t('Footer Navigation', 'Footer navigation')}>
            <a href={paths.routes.home}>{t('Start', 'Home')}</a>
            <a href={paths.routes.explore} aria-current="page">Explore</a>
            <a href={paths.routes.faq}>FAQ</a>
            <a href={paths.routes.register}>{t('Loslegen', 'Get started')}</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}
