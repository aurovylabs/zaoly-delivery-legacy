'use client'

import { Button } from '@zaoly/ui'
import { useRouter } from 'next/navigation'
import { EXPLORE_CHAPTERS, type ExploreChapterId } from '../lib/landing/explore'
import { paths } from '../lib/paths'
import { siteText } from '../lib/public-site-locale'
import { useUserPrefs } from '../lib/user-prefs'
import {
  InteractiveEditorStage,
  InteractiveKitStage,
  InteractivePathStage,
  InteractiveScreensStage,
  InteractiveTokenStage,
} from './landing-experience-stages'
import { ZaolySealMark } from './zaoly-seal-mark'

function Brand() {
  return <span className="zl-brand"><ZaolySealMark size={34} /><span>Zaoly</span></span>
}

export function ExploreChapterPage({ chapterId }: { chapterId: ExploreChapterId }) {
  const { locale, setLocale } = useUserPrefs()
  const router = useRouter()
  const t = (de: string, en: string) => siteText(locale, de, en)
  const chapter = EXPLORE_CHAPTERS.find((entry) => entry.id === chapterId) ?? EXPLORE_CHAPTERS[0]
  const title = locale === 'de' ? chapter.titleDe : chapter.titleEn
  const body = locale === 'de' ? chapter.bodyDe : chapter.bodyEn
  const productLabel = locale === 'de' ? chapter.productLabelDe : chapter.productLabelEn

  return (
    <main className="zl zl-explore zl-explore--chapter">
      <a className="zl-skip" href="#zl-explore-chapter-title">{t('Zum Inhalt springen', 'Skip to content')}</a>
      <header className="zl-header">
        <div className="zl-shell zl-header__inner">
          <a className="zl-header__brand" href={paths.routes.home} aria-label={t('Zaoly Startseite', 'Zaoly home')}><Brand /></a>
          <nav className="zl-nav" aria-label={t('Explore Navigation', 'Explore navigation')}>
            <a href={paths.routes.explore}>{t('Explore', 'Explore')}</a>
            {EXPLORE_CHAPTERS.map((entry) => (
              <a
                key={entry.id}
                href={paths.routes.exploreChapter(entry.id)}
                aria-current={entry.id === chapterId ? 'page' : undefined}
              >
                {locale === 'de' ? entry.labelDe : entry.labelEn}
              </a>
            ))}
          </nav>
          <div className="zl-header__actions">
            <div className="zl-language" role="group" aria-label={t('Sprache wählen', 'Choose language')}>
              {(['de', 'en'] as const).map((choice) => (
                <button key={choice} type="button" lang={choice} aria-pressed={locale === choice} onClick={() => { setLocale(choice); router.refresh() }}>
                  {choice.toUpperCase()}
                </button>
              ))}
            </div>
            <Button href={chapter.productHref} size="sm" className="zl-header__button">{productLabel} <span aria-hidden="true">↗</span></Button>
          </div>
        </div>
      </header>

      <section className="zl-explore__hero zl-explore__hero--chapter" aria-labelledby="zl-explore-chapter-title">
        <div className="zl-shell">
          <span className="zl-index">ZAOLY / EXPLORE / {(locale === 'de' ? chapter.labelDe : chapter.labelEn).toUpperCase()}</span>
          <p className="zl-demo-badge" role="note">
            {t('Öffentliche Demo · kein Login', 'Public demo · no sign-in')}
          </p>
          <h1 id="zl-explore-chapter-title">{title}</h1>
          <p>{body}</p>
          <div className="zl-explore__hero-actions">
            <a className="zl-arrow-link" href={paths.routes.explore}>{t('Alle Kapitel', 'All chapters')} <span aria-hidden="true">↗</span></a>
            <a className="zl-arrow-link zl-arrow-link--muted" href={chapter.productHref}>{productLabel} <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      <section className="zl-explore__stage-wrap" aria-label={t('Interaktive Demo', 'Interactive demo')}>
        <div className="zl-shell zl-explore__stage">
          {chapterId === 'editor' ? <InteractiveEditorStage locale={locale} density="deep" /> : null}
          {chapterId === 'kit' ? <InteractiveKitStage locale={locale} density="deep" /> : null}
          {chapterId === 'tokens' ? <InteractiveTokenStage locale={locale} density="deep" /> : null}
          {chapterId === 'screens' ? <InteractiveScreensStage locale={locale} density="deep" /> : null}
          {chapterId === 'path' ? <InteractivePathStage locale={locale} density="deep" /> : null}
        </div>
      </section>

      <footer className="zl-footer">
        <div className="zl-shell zl-footer__inner">
          <Brand />
          <nav aria-label={t('Footer Navigation', 'Footer navigation')}>
            <a href={paths.routes.home}>{t('Start', 'Home')}</a>
            <a href={paths.routes.explore}>Explore</a>
            <a href={paths.routes.register}>{t('Loslegen', 'Get started')}</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}
