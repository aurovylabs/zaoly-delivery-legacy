'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { paths } from '../lib/paths'
import { exploreChapterHref } from '../lib/landing/explore'
import {
  EXPERIENCE_TOUR_COMPACT,
  EXPERIENCE_TOUR_INTERVAL_MS,
  EXPERIENCE_TOUR_INTERVAL_REDUCED_MS,
  type ExperienceTourFrame,
  type LandingExperienceChapter,
} from '../lib/landing/experience-tour'
import { siteText } from '../lib/public-site-locale'
import type { UiLocaleId } from '../lib/user-prefs'
import {
  InteractiveEditorStage,
  InteractiveKitStage,
  InteractivePathStage,
  InteractiveScreensStage,
  InteractiveTokenStage,
} from './landing-experience-stages'

const TOUR = EXPERIENCE_TOUR_COMPACT

export type { LandingExperienceChapter }

type LandingExperienceProps = {
  locale: UiLocaleId
  sectionIds: { kit: string; tokens: string; workflow: string }
}

const CHAPTER_ORDER: LandingExperienceChapter[] = ['editor', 'kit', 'tokens', 'screens', 'path']

export function LandingExperience({ locale, sectionIds }: LandingExperienceProps) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  const [active, setActive] = useState<LandingExperienceChapter>('editor')
  const [manual, setManual] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [tourIndex, setTourIndex] = useState(0)
  const chapterRefs = useRef<Partial<Record<LandingExperienceChapter, HTMLElement | null>>>({})

  const tourFrame: ExperienceTourFrame | null = playing ? TOUR[tourIndex] ?? null : null

  const chapters: Array<{
    id: LandingExperienceChapter
    anchor?: string
    label: string
    title: ReactNode
    body: string
    href: string
    hrefLabel: string
    deepHref: string
    deepLabel: string
  }> = [
    {
      id: 'editor',
      label: t('Editor', 'Editor'),
      title: locale === 'de' ? <>Ein Arbeitsplatz.<br /><em>Drei Blickwinkel.</em></> : <>One workspace.<br /><em>Three lenses.</em></>,
      body: t(
        'Canvas, Masters, Preflight — Illustration hier; volle Demo unter Explore.',
        'Canvas, Masters, Preflight — illustration here; full demo on Explore.',
      ),
      href: paths.routes.editor,
      hrefLabel: t('App · Editor (Login)', 'App · Editor (sign-in)'),
      deepHref: exploreChapterHref('editor'),
      deepLabel: t('Demo · Editor vertiefen', 'Demo · Explore editor'),
    },
    {
      id: 'kit',
      anchor: sectionIds.kit,
      label: 'Zaoly Kit',
      title: locale === 'de' ? <>Atome.<br /><em>Daraus Layouts.</em></> : <>Atoms.<br /><em>Then layouts.</em></>,
      body: t(
        'Kit-Katalog tippen — auf Explore der volle Fundus und die Layout-Vorschau.',
        'Tap the Kit catalog — full inventory and layout preview on Explore.',
      ),
      href: paths.routes.kit,
      hrefLabel: t('App · Kit Playground (Login)', 'App · Kit Playground (sign-in)'),
      deepHref: exploreChapterHref('kit'),
      deepLabel: t('Demo · Kit vertiefen', 'Demo · Explore kit'),
    },
    {
      id: 'tokens',
      anchor: sectionIds.tokens,
      label: 'Token Studio',
      title: locale === 'de' ? <>Ein Pfad.<br /><em>Zwei Komponenten.</em></> : <>One path.<br /><em>Two components.</em></>,
      body: t(
        'Override tippen — Swatches und Skalen auf der Explore-Seite.',
        'Tap an override — swatches and scales on the explore page.',
      ),
      href: paths.routes.tokens,
      hrefLabel: t('App · Token Studio (Login)', 'App · Token Studio (sign-in)'),
      deepHref: exploreChapterHref('tokens'),
      deepLabel: t('Demo · Tokens vertiefen', 'Demo · Explore tokens'),
    },
    {
      id: 'screens',
      label: t('Screens', 'Screens'),
      title: locale === 'de' ? <>Dieselbe Seite.<br /><em>Andere Breite.</em></> : <>Same page.<br /><em>Different width.</em></>,
      body: t(
        'Desktop und Mobile hier — Tablet, Compare und mehr auf Explore.',
        'Desktop and mobile here — tablet, compare, and more on explore.',
      ),
      href: paths.routes.editor,
      hrefLabel: t('App · Editor (Login)', 'App · Editor (sign-in)'),
      deepHref: exploreChapterHref('screens'),
      deepLabel: t('Demo · Screens vertiefen', 'Demo · Explore screens'),
    },
    {
      id: 'path',
      anchor: sectionIds.workflow,
      label: t('Weg', 'Path'),
      title: locale === 'de' ? <>Form.<br /><em>System. Code.</em></> : <>Shape.<br /><em>System. Code.</em></>,
      body: t(
        'Drei Schritte tippen — Details und Autoplay auf Explore.',
        'Tap three steps — details and autoplay on explore.',
      ),
      href: paths.routes.register,
      hrefLabel: t('Loslegen', 'Get started'),
      deepHref: exploreChapterHref('path'),
      deepLabel: t('Demo · Weg vertiefen', 'Demo · Explore path'),
    },
  ]

  const stopTour = () => {
    setPlaying(false)
  }

  const startTour = () => {
    setManual(true)
    setTourIndex(0)
    setActive(TOUR[0].chapter)
    setPlaying(true)
  }

  useEffect(() => {
    const applyHash = () => {
      if (typeof window === 'undefined') return
      const hash = window.location.hash.replace(/^#/, '')
      if (hash === sectionIds.kit) setActive('kit')
      else if (hash === sectionIds.tokens) setActive('tokens')
      else if (hash === sectionIds.workflow) setActive('path')
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [sectionIds.kit, sectionIds.tokens, sectionIds.workflow])

  useEffect(() => {
    if (!playing) return
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const interval = reduced ? EXPERIENCE_TOUR_INTERVAL_REDUCED_MS : EXPERIENCE_TOUR_INTERVAL_MS
    const timer = window.setInterval(() => {
      setTourIndex((current) => {
        const next = current + 1
        if (next >= TOUR.length) {
          setPlaying(false)
          setManual(false)
          return current
        }
        setActive(TOUR[next].chapter)
        return next
      })
    }, interval)
    return () => window.clearInterval(timer)
  }, [playing])

  useEffect(() => {
    if (playing || manual || typeof IntersectionObserver === 'undefined') return
    const nodes = CHAPTER_ORDER.map((id) => chapterRefs.current[id]).filter(Boolean) as HTMLElement[]
    if (nodes.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const id = visible?.target.getAttribute('data-chapter') as LandingExperienceChapter | null
        if (id && CHAPTER_ORDER.includes(id)) setActive(id)
      },
      { root: null, rootMargin: '-32% 0px -48% 0px', threshold: [0.25, 0.5, 0.75] },
    )
    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [manual, playing])

  const selectChapter = (id: LandingExperienceChapter) => {
    stopTour()
    setManual(true)
    setActive(id)
    const node = chapterRefs.current[id]
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    window.setTimeout(() => setManual(false), 900)
  }

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = CHAPTER_ORDER.indexOf(active)
    if (index < 0) return
    let next = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % CHAPTER_ORDER.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + CHAPTER_ORDER.length) % CHAPTER_ORDER.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = CHAPTER_ORDER.length - 1
    else return
    event.preventDefault()
    const id = CHAPTER_ORDER[next]
    selectChapter(id)
    document.getElementById(`zl-exp-tab-${id}`)?.focus()
  }

  const activeMeta = chapters.find((chapter) => chapter.id === active) ?? chapters[0]
  const editorTour = tourFrame?.chapter === 'editor' ? tourFrame.step : null
  const kitTour = tourFrame?.chapter === 'kit' ? tourFrame.step : null
  const tokensTour = tourFrame?.chapter === 'tokens' ? tourFrame.step : null
  const screensTour = tourFrame?.chapter === 'screens' ? tourFrame.step : null
  const pathTour = tourFrame?.chapter === 'path' ? tourFrame.step : null

  return (
    <section className="zl-experience zl-experience--compact" aria-labelledby="zl-experience-title" data-playing={playing ? 'true' : undefined}>
      <div className="zl-shell zl-experience__intro">
        <span className="zl-index">{t('ERLEBE ZAOLY', 'EXPERIENCE ZAOLY')}</span>
        <h2 id="zl-experience-title">
          {locale === 'de' ? <>Nicht lesen.<br /><em>Ausprobieren.</em></> : <>Don’t just read.<br /><em>Try it.</em></>}
        </h2>
        <p>
          {t(
            'Fünf öffentliche Demos hier — volle Interaktion unter ',
            'Five public demos here — full interaction at ',
          )}
          <a href={paths.routes.explore}>/explore</a>
          {t(
            '. App-Links führen zu /editor, /kit und /tokens (Login).',
            '. App links go to /editor, /kit, and /tokens (sign-in).',
          )}
        </p>
      </div>

      <div className="zl-experience__track">
        <div className="zl-shell zl-experience__sticky">
          <div className="zl-experience__toolbar">
            <div
              className="zl-experience__tabs"
              role="tablist"
              aria-label={t('Produktkapitel', 'Product chapters')}
              onKeyDown={onTabKeyDown}
            >
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  role="tab"
                  id={`zl-exp-tab-${chapter.id}`}
                  aria-selected={active === chapter.id}
                  aria-controls={
                    chapter.id === 'kit'
                      ? sectionIds.kit
                      : chapter.id === 'tokens'
                        ? sectionIds.tokens
                        : chapter.id === 'path'
                          ? sectionIds.workflow
                          : `zl-exp-panel-${chapter.id}`
                  }
                  tabIndex={active === chapter.id ? 0 : -1}
                  className={active === chapter.id ? 'is-active' : undefined}
                  onClick={() => selectChapter(chapter.id)}
                >
                  {chapter.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`zl-experience__play${playing ? ' is-playing' : ''}`}
              aria-pressed={playing}
              onClick={() => (playing ? stopTour() : startTour())}
            >
              {playing ? t('Tour stoppen', 'Stop tour') : t('Tour abspielen', 'Play tour')}
            </button>
          </div>

          {playing ? (
            <div className="zl-experience__progress" aria-live="polite">
              <span>
                {t('Tour', 'Tour')} {tourIndex + 1}/{TOUR.length}
              </span>
              <i style={{ width: `${((tourIndex + 1) / TOUR.length) * 100}%` }} />
            </div>
          ) : null}

          <div className="zl-experience__stage" data-chapter={active}>
            <div role="tabpanel" id="zl-exp-panel-editor" aria-labelledby="zl-exp-tab-editor" hidden={active !== 'editor'} className="zl-experience__panel">
              <InteractiveEditorStage locale={locale} density="compact" tourStep={editorTour} onInteract={stopTour} />
            </div>
            <div role="tabpanel" id={sectionIds.kit} aria-labelledby="zl-exp-tab-kit" hidden={active !== 'kit'} className="zl-experience__panel">
              <InteractiveKitStage locale={locale} density="compact" tourStep={kitTour} onInteract={stopTour} />
            </div>
            <div role="tabpanel" id={sectionIds.tokens} aria-labelledby="zl-exp-tab-tokens" hidden={active !== 'tokens'} className="zl-experience__panel">
              <InteractiveTokenStage locale={locale} density="compact" tourStep={tokensTour} onInteract={stopTour} />
            </div>
            <div role="tabpanel" id="zl-exp-panel-screens" aria-labelledby="zl-exp-tab-screens" hidden={active !== 'screens'} className="zl-experience__panel">
              <InteractiveScreensStage locale={locale} density="compact" tourStep={screensTour} onInteract={stopTour} />
            </div>
            <div role="tabpanel" id={sectionIds.workflow} aria-labelledby="zl-exp-tab-path" hidden={active !== 'path'} className="zl-experience__panel">
              <InteractivePathStage locale={locale} density="compact" tourStep={pathTour} onInteract={stopTour} />
            </div>
          </div>

          <div className="zl-experience__caption">
            <div>
              <strong className="zl-experience__caption-title">{activeMeta.title}</strong>
              <p>{activeMeta.body}</p>
            </div>
            <div className="zl-experience__caption-links">
              <a className="zl-arrow-link" href={activeMeta.deepHref}>
                {activeMeta.deepLabel} <span aria-hidden="true">↗</span>
              </a>
              <a className="zl-arrow-link zl-arrow-link--muted" href={activeMeta.href}>
                {activeMeta.hrefLabel} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>

        <div className="zl-shell zl-experience__chapters" aria-hidden="true">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              data-chapter={chapter.id}
              ref={(node) => {
                chapterRefs.current[chapter.id] = node
              }}
              className={`zl-experience__chapter${active === chapter.id ? ' is-active' : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
