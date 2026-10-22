'use client'

import { Button } from '@zaoly/ui'
import { useRouter } from 'next/navigation'
import { paths } from '../lib/paths'
import { siteText } from '../lib/public-site-locale'
import { useUserPrefs } from '../lib/user-prefs'
import { ZaolySealMark } from './zaoly-seal-mark'
import { faqTopicsForLocale } from './faq-content'

const homeSection = (id: string) => `${paths.routes.home}#${id}`

function Brand() {
  return <span className="zl-brand"><ZaolySealMark size={34} /><span>Zaoly</span></span>
}

export function FaqPage() {
  const { locale, setLocale } = useUserPrefs()
  const router = useRouter()
  const t = (de: string, en: string) => siteText(locale, de, en)
  const faqTopics = faqTopicsForLocale(locale)
  return (
    <main className="zl zl-faq">
      <a className="zl-skip" href={`#${paths.faq.sections.product}`}>{t('Zum Inhalt springen', 'Skip to content')}</a>

      <header className="zl-header">
        <div className="zl-shell zl-header__inner">
          <a className="zl-header__brand" href={paths.routes.home} aria-label={t('Zaoly Startseite', 'Zaoly home')}><Brand /></a>
          <nav className="zl-nav" aria-label={t('FAQ Navigation', 'FAQ navigation')}>
            <a href={homeSection(paths.landing.sections.product)}>{t('Produkt', 'Product')}</a>
            <a href={homeSection(paths.landing.sections.kit)}>Zaoly Kit</a>
            <a href={homeSection(paths.landing.sections.tokens)}>Token Studio</a>
            <a href={homeSection(paths.landing.sections.workflow)}>Workflow</a>
            <a href={paths.routes.faq} aria-current="page">FAQ</a>
            <a href={homeSection(paths.landing.sections.contact)}>{t('Kontakt', 'Contact')}</a>
          </nav>
          <div className="zl-header__actions">
            <div className="zl-language" role="group" aria-label={t('Sprache wählen', 'Choose language')}>
              {(['de', 'en'] as const).map((choice) => <button key={choice} type="button" lang={choice} aria-pressed={locale === choice} onClick={() => { setLocale(choice); router.refresh() }}>{choice.toUpperCase()}</button>)}
            </div>
            <a href={paths.routes.login}>{t('Anmelden', 'Sign in')}</a>
            <Button href={paths.routes.editor} size="sm" className="zl-header__button">{t('Editor öffnen', 'Open editor')} <span aria-hidden="true">↗</span></Button>
          </div>
        </div>
      </header>

      <section className="zl-faq__hero" aria-labelledby="zl-faq-title">
        <div className="zl-shell">
          <span className="zl-index">ZAOLY / FAQ</span>
          <h1 id="zl-faq-title">{locale === 'de' ? <>Gute Fragen.<br /><em>Klare Antworten.</em></> : <>Good questions.<br /><em>Clear answers.</em></>}</h1>
          <p>{t('Konkrete Antworten zu Editor, Kit, lokalem Token-System, Zusammenarbeit und Entwickler-Handoff. Mit Abläufen, Zuständigkeiten und den Grenzen automatischer Übergabe.', 'Straight answers about the editor, Kit, local token system, collaboration, and developer handoff—including workflows, roles, and what handoff does and does not automate.')}</p>
        </div>
      </section>

      <div className="zl-shell zl-faq__layout">
        <nav className="zl-faq__topics" aria-label="FAQ Themen">
          <span className="zl-index">{t('THEMEN', 'TOPICS')}</span>
          {faqTopics.map((topic) => <a key={topic.id} href={`#${topic.id}`}><span>{topic.number}</span>{topic.title}<span aria-hidden="true">↘</span></a>)}
        </nav>

        <div className="zl-faq__sections">
          {faqTopics.map((topic) => (
            <section className="zl-faq__section" id={topic.id} key={topic.id} aria-labelledby={`${topic.id}-title`}>
              <div className="zl-faq__section-head"><span>{topic.number}</span><h2 id={`${topic.id}-title`}>{topic.title}</h2></div>
              <div className="zl-faq__questions">
                {topic.questions.map((item, questionIndex) => (
                  <details key={item.question} open={questionIndex === 0}>
                    <summary><span>{item.question}</span><span className="zl-faq__toggle" aria-hidden="true" /></summary>
                    <div className="zl-faq__answer">{item.answer}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <section className="zl-faq__end" aria-labelledby="zl-faq-end-title">
        <div className="zl-shell"><h2 id="zl-faq-end-title">{locale === 'de' ? <>Jetzt selbst<br /><em>gestalten.</em></> : <>Start designing<br /><em>for yourself.</em></>}</h2><div><p>{t('Öffne den Editor und mach aus deiner nächsten Idee eine Komponente, die weiterarbeitet.', 'Open the editor and turn your next idea into a component that keeps working.')}</p><Button href={paths.routes.editor} size="lg" className="zl-faq__cta">{t('Editor öffnen', 'Open editor')} <span aria-hidden="true">↗</span></Button></div></div>
      </section>

      <footer className="zl-footer"><div className="zl-shell zl-footer__inner"><a href={paths.routes.home} aria-label={t('Zaoly Startseite', 'Zaoly home')}><Brand /></a><nav aria-label={t('Footer Navigation', 'Footer navigation')}><a href={paths.routes.home}>{t('Startseite', 'Home')}</a><a href={paths.routes.editor}>Editor</a><a href={paths.routes.kit}>Zaoly Kit</a><a href={paths.routes.tokens}>Token Studio</a><a href={paths.routes.faq} aria-current="page">FAQ</a><a href={homeSection(paths.landing.sections.contact)}>{t('Kontakt', 'Contact')}</a></nav></div></footer>
    </main>
  )
}
