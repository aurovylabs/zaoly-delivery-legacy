'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { ExperienceTourFrame } from '../lib/landing/experience-tour'
import {
  kitAtomTsxSnippet,
  LANDING_EXAMPLE_COMPOSITION,
} from '../lib/landing/example-composition'
import {
  KIT_ATOM_CATEGORIES,
  KIT_ATOMS,
  kitAtomById,
  kitAtomsInCategory,
  type KitAtomCategory,
  type KitAtomId,
} from '../lib/landing/kit-atoms'
import { paths } from '../lib/paths'
import { siteText } from '../lib/public-site-locale'
import type { UiLocaleId } from '../lib/user-prefs'

type EditorMode = Extract<ExperienceTourFrame, { chapter: 'editor' }>['step']
type KitStep = Extract<ExperienceTourFrame, { chapter: 'kit' }>['step']
type TokenState = Extract<ExperienceTourFrame, { chapter: 'tokens' }>['step']
type BreakpointId = Extract<ExperienceTourFrame, { chapter: 'screens' }>['step']
type PathStep = Extract<ExperienceTourFrame, { chapter: 'path' }>['step']
type EditorFocus = 'heading' | 'button' | 'image'
type EditorPage = 'home' | 'contact'
type EditorZoom = '75' | '100' | '125'
type EditorProp = 'width' | 'size' | 'weight' | 'token'
type TokenCatalog = 'color' | 'type' | 'space'
type TokenSwatch = 'fixture' | 'override' | 'teal'
type TypeScale = 'h1' | 'body'
type SpaceScale = 's' | 'm' | 'l'
type PathDetail = 'none' | 'layer' | 'card' | 'binding' | 'import' | 'export'
export type StageDensity = 'compact' | 'deep'

type StageInteract = { onInteract?: () => void; density?: StageDensity }

const FOCUS_ORDER: EditorFocus[] = ['heading', 'button', 'image']
const BREAK_ORDER: BreakpointId[] = ['desktop', 'tablet', 'mobile']
const KIT_STEP_ORDER: KitStep[] = ['content', 'form', 'media', 'layout', 'data', 'page']
const KIT_COMPACT_STEPS: KitStep[] = ['content', 'layout', 'page']
const KIT_DEFAULT_ATOM: Record<Exclude<KitStep, 'page'>, KitAtomId> = {
  content: 'Text',
  form: 'Input',
  media: 'Image',
  layout: 'Stack',
  data: 'Table',
}

function Status({ children }: { children: ReactNode }) {
  return <p className="zl-experience__status" aria-live="polite">{children}</p>
}

function usePulse(ms = 700) {
  const [pulse, setPulse] = useState(false)
  const trigger = () => {
    setPulse(true)
    window.setTimeout(() => setPulse(false), ms)
  }
  return [pulse, trigger] as const
}

function Rail({
  items,
  active,
  label,
  onPick,
}: {
  items: Array<{ id: string; done?: boolean; current?: boolean; title: string }>
  active?: string
  label: string
  onPick?: (id: string) => void
}) {
  return (
    <div className="zl-experience__rail" role="group" aria-label={label}>
      {items.map((item) => {
        const className = `zl-experience__rail-dot${item.done || item.id === active ? ' is-on' : ''}${item.current || item.id === active ? ' is-current' : ''}`
        if (onPick) {
          return (
            <button
              key={item.id}
              type="button"
              className={className}
              title={item.title}
              aria-label={item.title}
              aria-current={item.id === active ? 'step' : undefined}
              onClick={() => onPick(item.id)}
            />
          )
        }
        return <span key={item.id} className={className} title={item.title} />
      })}
    </div>
  )
}

export function InteractiveEditorStage({
  locale,
  tourStep,
  onInteract,
  density = 'compact',
}: { locale: UiLocaleId; tourStep?: EditorMode | null } & StageInteract) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  const deep = density === 'deep'
  const [mode, setMode] = useState<EditorMode>('design')
  const [focus, setFocus] = useState<EditorFocus>('heading')
  const [page, setPage] = useState<EditorPage>('home')
  const [zoom, setZoom] = useState<EditorZoom>('100')
  const [prop, setProp] = useState<EditorProp>('token')
  const [grid, setGrid] = useState(false)
  const [pin, setPin] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [pulse, triggerPulse] = usePulse()

  useEffect(() => {
    if (tourStep) setMode(tourStep)
  }, [tourStep])

  const touch = () => onInteract?.()

  const chooseMode = (id: EditorMode) => {
    touch()
    setMode(id)
  }

  const chooseFocus = (id: EditorFocus) => {
    touch()
    setFocus(id)
    triggerPulse()
  }

  const choosePage = (id: EditorPage) => {
    touch()
    setPage(id)
    triggerPulse()
  }

  const chooseZoom = (id: EditorZoom) => {
    touch()
    setZoom(id)
  }

  const chooseProp = (id: EditorProp) => {
    touch()
    setProp(id)
    triggerPulse()
  }

  const cycleFocus = () => {
    const next = FOCUS_ORDER[(FOCUS_ORDER.indexOf(focus) + 1) % FOCUS_ORDER.length]
    chooseFocus(next)
  }

  const focusLabel =
    focus === 'heading' ? 'Heading' : focus === 'button' ? 'Button' : 'Image'

  const pageTitle = page === 'home' ? 'HOME' : 'CONTACT'
  const headline =
    page === 'home'
      ? locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>
      : locale === 'de' ? <>Schreib uns.<br />Wir antworten.</> : <>Write to us.<br />We reply.</>
  const sub =
    page === 'home'
      ? t('Design wird zur Sprache eines Produkts.', 'Design becomes the language of a product.')
      : t('Ein Kanal für Produktfragen und Rollouts.', 'One channel for product questions and rollouts.')
  const cta =
    page === 'home'
      ? t('Projekt entdecken', 'Explore project')
      : t('Gespräch starten', 'Start a conversation')

  return (
    <div
      className={`zl-editor-tour is-interactive${pulse ? ' is-pulse' : ''}${grid ? ' is-grid' : ''}${pin ? ' is-pin' : ''}`}
      data-loop="editor"
      data-density={density}
      data-mode={mode}
      data-focus={focus}
      data-page={page}
      data-zoom={zoom}
      data-prop={prop}
      data-grid={grid ? 'true' : 'false'}
      data-pin={pin ? 'true' : 'false'}
      role="group"
      aria-label={t(
        'Interaktive Editor-Illustration: wechsle zwischen Canvas, Masters und Preflight',
        'Interactive editor illustration: switch between Canvas, Masters, and Preflight',
      )}
    >
      <p className="zl-stage-badge" role="note">
        {t('Illustration · nicht der Live-Editor', 'Illustration · not the live editor')}
      </p>
      <div className="zl-editor-tour__top">
        <strong aria-hidden="true"><i>造</i> ZAOLY <span>/</span> STUDIO FORM</strong>
        <div className="zl-editor-tour__modes" role="tablist" aria-label={t('Illustrations-Linsen', 'Illustration lenses')}>
          {([
            ['design', 'Canvas'],
            ['system', 'Masters'],
            ['check', 'Preflight'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              className={`zl-editor-tour__mode--${id}`}
              aria-selected={mode === id}
              onClick={() => chooseMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {deep ? (
          <button
            type="button"
            className={`zl-editor-tour__saved is-button${savedFlash ? ' is-flash' : ''}`}
            onClick={() => {
              touch()
              setSavedFlash(true)
              window.setTimeout(() => setSavedFlash(false), 900)
            }}
          >
            <i /> {savedFlash ? t('Gerade gespeichert', 'Just saved') : t('Gespeichert', 'Saved')}
          </button>
        ) : (
          <span className="zl-editor-tour__saved" aria-hidden="true"><i /> {t('Gespeichert', 'Saved')}</span>
        )}
      </div>
      <div className="zl-editor-tour__body">
        <div className="zl-editor-tour__left">
          <div className="zl-editor-tour__pane zl-editor-tour__pane--design">
            <span className="zl-editor-tour__pane-label">{t('SEITEN', 'PAGES')}</span>
            <button
              type="button"
              className={`zl-editor-tour__row${page === 'home' ? ' zl-editor-tour__row--active' : ''}`}
              aria-pressed={page === 'home'}
              onClick={() => choosePage('home')}
            >
              ▣ <span>Home</span><i>↗</i>
            </button>
            <button
              type="button"
              className={`zl-editor-tour__row${page === 'contact' ? ' zl-editor-tour__row--active' : ''}`}
              aria-pressed={page === 'contact'}
              onClick={() => choosePage('contact')}
            >
              ▣ <span>Contact</span>
            </button>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">{t('EBENEN', 'LAYERS')} / {pageTitle}</span>
            <button type="button" className="zl-editor-tour__row" onClick={() => chooseFocus('image')}>▤ <span>Hero</span></button>
            <button type="button" className={`zl-editor-tour__row zl-editor-tour__row--inset${focus === 'image' ? ' zl-editor-tour__row--selected' : ''}`} onClick={() => chooseFocus('image')}>▧ <span>Image</span></button>
            <button type="button" className={`zl-editor-tour__row zl-editor-tour__row--inset${focus === 'heading' ? ' zl-editor-tour__row--selected' : ''}`} onClick={() => chooseFocus('heading')}>T <span>Heading</span></button>
            <button type="button" className={`zl-editor-tour__row zl-editor-tour__row--inset${focus === 'button' ? ' zl-editor-tour__row--selected' : ''}`} onClick={() => chooseFocus('button')}>▰ <span>Button</span></button>
            {deep ? (
              <button type="button" className="zl-editor-tour__cycle" onClick={cycleFocus}>
                {t('Nächste Ebene', 'Next layer')} ⟳
              </button>
            ) : null}
          </div>
          <div className="zl-editor-tour__pane zl-editor-tour__pane--system" aria-hidden="true">
            <span className="zl-editor-tour__pane-label">ZAOLY KIT</span>
            <span className="zl-editor-tour__row">T <span>Text</span></span>
            <span className="zl-editor-tour__row">▰ <span>Button</span></span>
            <span className="zl-editor-tour__row">▧ <span>Image</span></span>
            <span className="zl-editor-tour__row">▦ <span>Grid / Stack</span></span>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">MASTERS</span>
            <span className="zl-editor-tour__row zl-editor-tour__row--selected">◇ <span>{LANDING_EXAMPLE_COMPOSITION.name}</span></span>
            <span className="zl-editor-tour__row zl-editor-tour__example-note">{locale === 'de' ? LANDING_EXAMPLE_COMPOSITION.labelDe : LANDING_EXAMPLE_COMPOSITION.labelEn}</span>
            <span className="zl-editor-tour__row">◇ <span>SiteHeader</span></span>
          </div>
          <div className="zl-editor-tour__pane zl-editor-tour__pane--check" aria-hidden="true">
            <span className="zl-editor-tour__pane-label">{t('QUALITÄT', 'QUALITY')}</span>
            <span className="zl-editor-tour__row zl-editor-tour__row--active">✓ <span>Preflight</span></span>
            <span className="zl-editor-tour__row">◷ <span>Versionen</span></span>
            <span className="zl-editor-tour__row">◌ <span>Kommentare</span></span>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">HANDOFF</span>
            <span className="zl-editor-tour__row">⌘ <span>React-Export</span></span>
            <span className="zl-editor-tour__row">↗ <span>Preview</span></span>
          </div>
        </div>
        <div className="zl-editor-tour__canvas">
          <div className="zl-editor-tour__canvas-meta">
            <span>{pageTitle} / DESKTOP 1440</span>
            {deep ? (
              <div className="zl-editor-tour__zoom" role="group" aria-label={t('Zoom', 'Zoom')}>
                {(['75', '100', '125'] as const).map((id) => (
                  <button key={id} type="button" aria-pressed={zoom === id} onClick={() => chooseZoom(id)}>
                    {id}%
                  </button>
                ))}
              </div>
            ) : (
              <span>{zoom}%</span>
            )}
          </div>
          <div className="zl-editor-tour__artboard">
            <div className="zl-editor-tour__page-nav"><strong>STUDIO FORM</strong><span>WORK&nbsp;&nbsp; ABOUT&nbsp;&nbsp; CONTACT</span></div>
            <div className="zl-editor-tour__page-copy">
              <small>{page === 'home' ? t('GESTALTUNG MIT SYSTEM', 'DESIGN WITH A SYSTEM') : t('KONTAKT', 'CONTACT')}</small>
              <button type="button" className="zl-editor-tour__hit zl-editor-tour__hit--heading" aria-pressed={focus === 'heading'} onClick={() => chooseFocus('heading')}>
                <strong>{headline}</strong>
              </button>
              <p>{sub}</p>
              <button type="button" className="zl-editor-tour__hit zl-editor-tour__hit--button" aria-pressed={focus === 'button'} onClick={() => chooseFocus('button')}>
                {cta} ↗
              </button>
            </div>
            <button type="button" className="zl-editor-tour__page-art zl-editor-tour__hit zl-editor-tour__hit--image" aria-pressed={focus === 'image'} onClick={() => chooseFocus('image')}>
              <span>{page === 'home' ? <>FORM<br />01</> : <>NOTE<br />02</>}</span><i />
            </button>
            {deep ? (
              <button type="button" className="zl-editor-tour__selection" onClick={cycleFocus} aria-label={t('Auswahl wechseln', 'Cycle selection')}>
                <i>{focusLabel}</i>
              </button>
            ) : (
              <div className="zl-editor-tour__selection" aria-hidden="true"><i>{focusLabel}</i></div>
            )}
            {deep ? (
              <button type="button" className="zl-editor-tour__binding" onClick={() => chooseProp('token')}>
                ↗ &nbsp;color.action.primary
              </button>
            ) : (
              <div className="zl-editor-tour__binding" aria-hidden="true">↗ &nbsp;color.action.primary</div>
            )}
            {deep && pin ? <span className="zl-editor-tour__pin" aria-hidden="true">PIN</span> : null}
            <div className="zl-editor-tour__issue"><b>✓</b> {t('Preflight geprüft', 'Preflight checked')}</div>
            <div className="zl-editor-tour__page-foot">{page === 'home' ? 'SELECTED WORK' : 'INBOX'} <span>01 / 03</span></div>
          </div>
          <div className="zl-editor-tour__canvas-foot"><span>CANVAS</span><span>DESKTOP · 1440 × 900 · {zoom}%</span></div>
        </div>
        <div className="zl-editor-tour__right">
          <div className="zl-editor-tour__pane zl-editor-tour__pane--design">
            <span className="zl-editor-tour__pane-label">INSPECT / {focusLabel.toUpperCase()}</span>
            <strong className="zl-editor-tour__panel-title">
              {focus === 'heading'
                ? headline
                : focus === 'button'
                  ? cta
                  : page === 'home' ? 'FORM 01' : 'NOTE 02'}
            </strong>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">DESIGN</span>
            {deep ? (
              <>
                <button type="button" className={`zl-editor-tour__field${prop === 'width' ? ' is-active' : ''}`} onClick={() => chooseProp('width')}>
                  <span>{t('Breite', 'Width')}</span><b>{focus === 'image' ? '34%' : 'Auto'}</b>
                </button>
                <button type="button" className={`zl-editor-tour__field${prop === 'size' ? ' is-active' : ''}`} onClick={() => chooseProp('size')}>
                  <span>{t('Größe', 'Size')}</span><b>{focus === 'heading' ? '64 px' : focus === 'button' ? '14 px' : '—'}</b>
                </button>
                <button type="button" className={`zl-editor-tour__field${prop === 'weight' ? ' is-active' : ''}`} onClick={() => chooseProp('weight')}>
                  <span>{t('Gewicht', 'Weight')}</span><b>{focus === 'heading' ? '700' : '650'}</b>
                </button>
                <button type="button" className={`zl-editor-tour__field${prop === 'token' ? ' is-active' : ''}`} onClick={() => chooseProp('token')}>
                  <span>Farbe</span><b><i /> {focus === 'button' ? 'Primary' : 'Ink'}</b>
                </button>
                <div className="zl-editor-tour__deep-tools" role="group" aria-label={t('Editor-Extras', 'Editor extras')}>
                  <button type="button" aria-pressed={grid} onClick={() => { touch(); setGrid((v) => !v) }}>{t('Raster', 'Grid')}</button>
                  <button type="button" aria-pressed={pin} onClick={() => { touch(); setPin((v) => !v); triggerPulse() }}>{t('Pin', 'Pin')}</button>
                </div>
              </>
            ) : (
              <>
                <div className="zl-editor-tour__field"><span>{t('Breite', 'Width')}</span><b>{focus === 'image' ? '34%' : 'Auto'}</b></div>
                <div className="zl-editor-tour__field"><span>{t('Größe', 'Size')}</span><b>{focus === 'heading' ? '64 px' : focus === 'button' ? '14 px' : '—'}</b></div>
                <div className="zl-editor-tour__field"><span>Farbe</span><b><i /> {focus === 'button' ? 'Primary' : 'Ink'}</b></div>
              </>
            )}
          </div>
          <div className="zl-editor-tour__pane zl-editor-tour__pane--system" aria-hidden="true">
            <span className="zl-editor-tour__pane-label">SYSTEM / FEATURECARD</span>
            <strong className="zl-editor-tour__panel-title">{locale === 'de' ? <>Gebunden.<br />Wiederverwendbar.</> : <>Bound.<br />Reusable.</>}</strong>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">VARIANTE</span>
            <div className="zl-editor-tour__field"><span>Aktiv</span><b>Editorial</b></div>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">TOKEN-PFADE</span>
            <div className="zl-editor-tour__token">typography.heading.h1</div>
            <div className="zl-editor-tour__token">color.action.primary</div>
          </div>
          <div className="zl-editor-tour__pane zl-editor-tour__pane--check" aria-hidden="true">
            <span className="zl-editor-tour__pane-label">PREFLIGHT / EXPORT</span>
            <strong className="zl-editor-tour__panel-title">{locale === 'de' ? <>Bereit für<br />den nächsten Schritt.</> : <>Ready for<br />the next step.</>}</strong>
            <div className="zl-editor-tour__check"><b>✓</b> {t('Kontrast geprüft', 'Contrast checked')}</div>
            <div className="zl-editor-tour__check"><b>✓</b> {t('Fokus-Reihenfolge', 'Focus order')}</div>
            <div className="zl-editor-tour__check"><b>✓</b> {t('Touch-Ziele', 'Touch targets')}</div>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">REACT-HANDOFF</span>
            <div className="zl-editor-tour__export">{LANDING_EXAMPLE_COMPOSITION.fileName} <span>↗</span></div>
          </div>
        </div>
      </div>
      <Status>
        {t('Auswahl', 'Selection')}: {focusLabel} · {pageTitle}
        {deep ? ` · ${zoom}% · ${prop}` : ''}
        {deep && grid ? ` · ${t('Raster', 'Grid')}` : ''}
        {deep && pin ? ' · Pin' : ''}
        {' · '}
        {mode === 'design' ? 'Canvas' : mode === 'system' ? 'Masters' : 'Preflight'}
      </Status>
      <p className="zl-experience__hint">
        {deep
          ? t(
              'Illustration · Seiten · Zoom · Layers · Canvas · Inspector · Raster/Pin.',
              'Illustration · pages · zoom · layers · canvas · inspector · grid/pin.',
            )
          : t(
              'Illustration · Linsen · Seiten · Layers · Canvas-Hotspots.',
              'Illustration · lenses · pages · layers · canvas hotspots.',
            )}
      </p>
    </div>
  )
}

export function InteractiveKitStage({
  locale,
  tourStep,
  onInteract,
  density = 'compact',
}: { locale: UiLocaleId; tourStep?: KitStep | null } & StageInteract) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  const deep = density === 'deep'
  const stepOrder = deep ? KIT_STEP_ORDER : KIT_COMPACT_STEPS
  const [step, setStep] = useState<KitStep>('content')
  const [selectedAtom, setSelectedAtom] = useState<KitAtomId>('Text')
  const [pulse, triggerPulse] = usePulse()

  useEffect(() => {
    if (!tourStep) return
    setStep(tourStep)
    if (tourStep !== 'page') setSelectedAtom(KIT_DEFAULT_ATOM[tourStep])
  }, [tourStep])

  const chooseStep = (id: KitStep) => {
    onInteract?.()
    setStep(id)
    if (id !== 'page') setSelectedAtom(KIT_DEFAULT_ATOM[id])
    triggerPulse()
  }

  const chooseAtom = (id: KitAtomId) => {
    onInteract?.()
    const atom = kitAtomById(id)
    if (!atom) return
    setSelectedAtom(id)
    // Stay on Page when highlighting atoms in the layout composition;
    // only leave Page via category tabs / stepper.
    if (step !== 'page') setStep(atom.category)
    triggerPulse()
  }

  const go = (delta: number) => {
    const index = stepOrder.indexOf(step)
    const safe = index < 0 ? 0 : index
    chooseStep(stepOrder[(safe + delta + stepOrder.length) % stepOrder.length])
  }

  const categoryMeta =
    step === 'page'
      ? {
          id: 'page' as const,
          labelDe: 'Seite',
          labelEn: 'Page',
          whyDe: 'Layout-Atome ordnen Content, Form und Media zu einer vollständigen Seite — derselbe Satz Atome, neue Komposition.',
          whyEn: 'Layout atoms arrange content, form, and media into a full page — same atom set, new composition.',
        }
      : KIT_ATOM_CATEGORIES.find((entry) => entry.id === step)!

  const visibleAtoms =
    step === 'page'
      ? KIT_ATOMS.filter((atom) => atom.category === 'layout' || atom.category === 'content')
      : deep
        ? kitAtomsInCategory(step as KitAtomCategory)
        : kitAtomsInCategory(step as KitAtomCategory).slice(0, 4)

  const activeAtom = kitAtomById(selectedAtom)
  const categoryTabs: KitStep[] = deep ? KIT_STEP_ORDER : KIT_COMPACT_STEPS

  return (
    <div
      className={`zl-experience__kit is-interactive zl-kit-board${pulse ? ' is-pulse' : ''}`}
      data-loop="kit"
      data-density={density}
      data-step={step}
      data-atom={selectedAtom}
      role="group"
      aria-label={t(
        'Interaktives Zaoly Kit: Atome des Katalogs und warum sie Layouts tragen',
        'Interactive Zaoly Kit: catalog atoms and why they carry layouts',
      )}
    >
      <div className="zl-experience__kit-controls" role="tablist" aria-label={t('Kit-Kategorien', 'Kit categories')}>
        {categoryTabs.map((id) => {
          const label =
            id === 'page'
              ? t('Seite', 'Page')
              : locale === 'de'
                ? KIT_ATOM_CATEGORIES.find((c) => c.id === id)!.labelDe
                : KIT_ATOM_CATEGORIES.find((c) => c.id === id)!.labelEn
          return (
            <button key={id} type="button" role="tab" aria-selected={step === id} onClick={() => chooseStep(id)}>
              {label}
            </button>
          )
        })}
        <div className="zl-experience__stepper" role="group" aria-label={t('Kategorie schrittweise', 'Step through categories')}>
          <button type="button" onClick={() => go(-1)} aria-label={t('Vorherige Kategorie', 'Previous category')}>‹</button>
          <button type="button" onClick={() => go(1)} aria-label={t('Nächste Kategorie', 'Next category')}>›</button>
        </div>
      </div>

      {deep ? (
        <Rail
          label={t('Kit-Fortschritt', 'Kit progress')}
          active={step}
          onPick={(id) => chooseStep(id as KitStep)}
          items={KIT_STEP_ORDER.map((id) => ({
            id,
            title: id,
            current: step === id,
            done: KIT_STEP_ORDER.indexOf(id) <= KIT_STEP_ORDER.indexOf(step),
          }))}
        />
      ) : null}

      <div className={`zl-kit-board__body${deep && step !== 'page' ? ' zl-kit-board__body--playground' : ''}`}>
        <div className="zl-kit-board__catalog">
          <div className="zl-kit-board__catalog-head">
            <strong>{locale === 'de' ? categoryMeta.labelDe : categoryMeta.labelEn}</strong>
            <span>{KIT_ATOMS.length} {t('Atome im Seed', 'atoms in seed')}</span>
          </div>
          <p className="zl-kit-board__why">{locale === 'de' ? categoryMeta.whyDe : categoryMeta.whyEn}</p>
          <div className="zl-kit-board__grid" role="group" aria-label={t('Kit-Atome', 'Kit atoms')}>
            {(step === 'page' && deep ? KIT_ATOMS : visibleAtoms).map((atom) => (
              <button
                key={atom.id}
                type="button"
                className={`zl-kit-board__atom${selectedAtom === atom.id ? ' is-active' : ''}`}
                aria-pressed={selectedAtom === atom.id}
                aria-label={atom.exportName}
                onClick={() => chooseAtom(atom.id)}
              >
                <span className="zl-kit-board__atom-mark" aria-hidden="true" data-kind={atom.category} />
                <strong aria-hidden="true">{atom.exportName}</strong>
                <small>{locale === 'de' ? atom.roleDe : atom.roleEn}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="zl-kit-board__preview" data-mode={step === 'page' ? 'page' : 'atom'}>
          {step === 'page' ? (
            <>
              <div className="zl-kit-board__preview-head">
                <span>{t('LAYOUT AUS ATOMEN', 'LAYOUT FROM ATOMS')}</span>
                <span>Stack · Grid · Container</span>
              </div>
              <div className="zl-kit-board__page" aria-hidden="true">
                <div className="zl-kit-board__page-nav">
                  <b>Container</b>
                  <span>Link</span>
                  <span>Link</span>
                  <i>Button</i>
                </div>
                <div className="zl-kit-board__page-hero">
                  <div>
                    <small>Text</small>
                    <strong>{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</strong>
                    <p>{t('Dieselben Atome. Ein Layout.', 'Same atoms. One layout.')}</p>
                    <b>Button</b>
                  </div>
                  <div className="zl-kit-board__page-media"><span>Image</span></div>
                </div>
                <div className="zl-kit-board__page-grid">
                  <div><span>Badge</span><strong>Stack</strong><em>Text</em></div>
                  <div><span>Badge</span><strong>Grid</strong><em>Text</em></div>
                  <div><span>Badge</span><strong>Divider</strong><em>Text</em></div>
                </div>
                <div className="zl-kit-board__page-form">
                  <span>Input</span>
                  <span>Select</span>
                  <b>Button</b>
                </div>
              </div>
              <p className="zl-kit-board__page-note">
                {t(
                  'Vollständige Seiten entstehen, weil Layout-Atome den Katalog zusammensetzen — nicht weil jedes Screen neu erfunden wird.',
                  'Full pages emerge because layout atoms compose the catalog — not because every screen is reinvented.',
                )}
              </p>
            </>
          ) : (
            <>
              <div className="zl-kit-board__preview-head">
                <span>{t('VORSCHAU', 'PREVIEW')}</span>
                <span>{activeAtom?.exportName}</span>
              </div>
              <div className={`zl-kit-board__sample zl-kit-board__sample--${selectedAtom.toLowerCase()}`} aria-hidden="true">
                {selectedAtom === 'Button' ? <b>{t('Aktion', 'Action')}</b> : null}
                {selectedAtom === 'Text' ? <strong>{t('Überschrift und Fließtext', 'Heading and body')}</strong> : null}
                {selectedAtom === 'Link' ? <u>{t('Weiterlesen', 'Read more')}</u> : null}
                {selectedAtom === 'Badge' ? <i>New</i> : null}
                {selectedAtom === 'Input' || selectedAtom === 'Textarea' ? <span>{selectedAtom}</span> : null}
                {selectedAtom === 'Select' ? <span>Select ▾</span> : null}
                {selectedAtom === 'Checkbox' ? <span>✓ Checkbox</span> : null}
                {selectedAtom === 'Image' || selectedAtom === 'Svg' || selectedAtom === 'Shape' ? <em>{selectedAtom}</em> : null}
                {selectedAtom === 'Chart' || selectedAtom === 'Gauge' ? <em>{selectedAtom}</em> : null}
                {selectedAtom === 'Stack' || selectedAtom === 'Grid' || selectedAtom === 'Container' || selectedAtom === 'Divider' ? (
                  <div className="zl-kit-board__layout-demo" data-layout={selectedAtom}>
                    <span /><span /><span />
                  </div>
                ) : null}
                {selectedAtom === 'Table' ? <em>Table</em> : null}
              </div>
              <p className="zl-kit-board__page-note">
                {activeAtom
                  ? locale === 'de'
                    ? `${activeAtom.exportName}: ${activeAtom.roleDe}. Als Atom im Seed — Grundlage für jede Layout-Komposition.`
                    : `${activeAtom.exportName}: ${activeAtom.roleEn}. Seed atom — foundation for every layout composition.`
                  : null}
              </p>
            </>
          )}
        </div>

        {deep && step !== 'page' && activeAtom ? (
          <div className="zl-kit-board__tsx" aria-label={t('TSX-Snippet aus dem Seed', 'TSX snippet from the seed')}>
            <div className="zl-kit-board__preview-head">
              <span>TSX</span>
              <span>@zaoly/site-kit</span>
            </div>
            <pre className="zl-kit-board__tsx-code"><code>{kitAtomTsxSnippet(activeAtom.exportName)}</code></pre>
            <p className="zl-kit-board__page-note">
              {t(
                'Playground-lite · im Kit Playground (App) mit Live-Props und Tokens.',
                'Playground-lite · full props and tokens in Kit Playground (App).',
              )}
            </p>
          </div>
        ) : null}
      </div>

      <Status>
        {step === 'page'
          ? t('Seite aus Atomen · Layout trägt den Katalog', 'Page from atoms · layout carries the catalog')
          : `${activeAtom?.exportName ?? ''} · ${locale === 'de' ? categoryMeta.labelDe : categoryMeta.labelEn}`}
        {deep && step !== 'page' ? ` · ${t('TSX', 'TSX')}` : ''}
        {` · ${KIT_ATOMS.length}`}
      </Status>
      <p className="zl-experience__hint">
        {deep
          ? t(
              'Kategorien · alle Atome · Vorschau · TSX · Seite zeigt das Layout-Prinzip.',
              'Categories · all atoms · preview · TSX · Page shows the layout principle.',
            )
          : t('Inhalt · Layout · Seite — voller Katalog auf Explore.', 'Content · Layout · Page — full catalog on Explore.')}
      </p>
    </div>
  )
}

export function InteractiveTokenStage({
  locale,
  tourStep,
  onInteract,
  density = 'compact',
}: { locale: UiLocaleId; tourStep?: TokenState | null } & StageInteract) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  const deep = density === 'deep'
  const [state, setState] = useState<TokenState>('after')
  const [catalog, setCatalog] = useState<TokenCatalog>('color')
  const [swatch, setSwatch] = useState<TokenSwatch>('override')
  const [typeScale, setTypeScale] = useState<TypeScale>('h1')
  const [spaceScale, setSpaceScale] = useState<SpaceScale>('m')
  const [pulse, triggerPulse] = usePulse()
  const [highlight, setHighlight] = useState<'one' | 'two' | 'both'>('both')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (tourStep) {
      setState(tourStep)
      setCatalog('color')
      setSwatch(tourStep === 'after' ? 'override' : 'fixture')
    }
  }, [tourStep])

  const touch = () => onInteract?.()

  const pickSwatch = (id: TokenSwatch) => {
    touch()
    setCatalog('color')
    setSwatch(id)
    setState(id === 'fixture' ? 'before' : 'after')
    setHighlight('both')
    triggerPulse()
  }

  const toggleColor = () => {
    pickSwatch(state === 'after' ? 'fixture' : 'override')
  }

  const pickCatalog = (id: TokenCatalog) => {
    touch()
    setCatalog(id)
    triggerPulse()
  }

  const pickCard = (id: 'one' | 'two') => {
    touch()
    setHighlight(id)
    triggerPulse()
  }

  const uses = highlight === 'both' ? 2 : 1
  const swatchCode =
    swatch === 'fixture' ? '#1F44FF' : swatch === 'override' ? '#7457D8' : '#0F766E'
  const typeLabel = typeScale === 'h1' ? 'typography.heading.h1' : 'typography.body.m'
  const spaceLabel =
    spaceScale === 's' ? 'spacing.static.small' : spaceScale === 'm' ? 'spacing.static.medium' : 'spacing.static.large'
  const spaceValue = spaceScale === 's' ? '0.5rem' : spaceScale === 'm' ? '1rem' : '1.5rem'
  const activePath = catalog === 'color' ? 'color.action.primary' : catalog === 'type' ? typeLabel : spaceLabel

  return (
    <div
      className={`zl-token-stage is-interactive${pulse ? ' is-pulse' : ''}`}
      data-loop="tokens"
      data-density={density}
      data-state={state}
      data-catalog={catalog}
      data-highlight={highlight}
      data-swatch={swatch}
      data-type={typeScale}
      data-space={spaceScale}
      role="group"
      aria-label={t(
        'Interaktives Token Studio: schalte den Farbwert um und sieh gebundene Komponenten reagieren',
        'Interactive Token Studio: toggle the color value and see bound components respond',
      )}
      style={catalog === 'color' ? { ['--zl-token-live' as string]: swatchCode } : undefined}
    >
      <div className="zl-token-stage__window">
        <span><b /> ZAOLY / TOKEN STUDIO</span>
        <span>{t('LOKALES PACK', 'LOCAL PACK')}</span>
      </div>
      <div className="zl-token-stage__body">
        <div className="zl-token-stage__catalog">
          <div className="zl-token-stage__catalog-head">Tokens <span>{t('LOKALES PACK', 'LOCAL PACK')}</span></div>
          <button
            type="button"
            className={`zl-token-stage__entry zl-token-stage__entry--color${catalog === 'color' ? ' is-active' : ''}`}
            aria-pressed={catalog === 'color' && state === 'after'}
            onClick={toggleColor}
          >
            <i className="zl-token-stage__swatch" />
            <span><strong>{t('Farbe', 'Color')}</strong><small>color.action.primary</small></span>
            <b>↗</b>
          </button>
          <button type="button" className={`zl-token-stage__entry zl-token-stage__entry--type${catalog === 'type' ? ' is-active' : ''}`} onClick={() => pickCatalog('type')}>
            <i className="zl-token-stage__glyph">Aa</i>
            <span><strong>{t('Typografie', 'Typography')}</strong><small>{typeLabel}</small></span>
            <b>↗</b>
          </button>
          <button type="button" className={`zl-token-stage__entry zl-token-stage__entry--space${catalog === 'space' ? ' is-active' : ''}`} onClick={() => pickCatalog('space')}>
            <i className="zl-token-stage__glyph">↔</i>
            <span><strong>{t('Abstand', 'Spacing')}</strong><small>{spaceLabel}</small></span>
            <b>↗</b>
          </button>
        </div>
        <div className="zl-token-stage__preview">
          <div className="zl-token-stage__preview-head">
            <span>{t('GEBUNDENE KOMPONENTEN', 'BOUND COMPONENTS')}</span>
            <span>{uses} {t('VERWENDUNGEN', 'USES')}</span>
          </div>
          <div className="zl-token-stage__value">
            <span className="zl-token-stage__value-swatch" />
            <span className="zl-token-stage__value-path">{activePath}</span>
            <span className="zl-token-stage__value-code">
              {catalog === 'color' ? (
                <b>{swatchCode}</b>
              ) : catalog === 'type' ? (
                <b>{typeScale === 'h1' ? 'Noto Sans JP / 700' : 'Geist / 500'}</b>
              ) : (
                <b>{spaceValue}</b>
              )}
            </span>
            {deep ? (
              <button
                type="button"
                className="zl-token-stage__copy"
                onClick={() => {
                  touch()
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1200)
                }}
              >
                {copied ? t('Kopiert', 'Copied') : t('Pfad kopieren', 'Copy path')}
              </button>
            ) : null}
          </div>

          {deep && catalog === 'color' ? (
            <div className="zl-token-stage__swatches" role="group" aria-label={t('Farbswatches', 'Color swatches')}>
              {([
                ['fixture', '#1F44FF', t('Fixture', 'Fixture')],
                ['override', '#7457D8', t('Override', 'Override')],
                ['teal', '#0F766E', t('Teal', 'Teal')],
              ] as const).map(([id, hex, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`zl-token-stage__chip${swatch === id ? ' is-active' : ''}`}
                  aria-pressed={swatch === id}
                  style={{ ['--zl-chip' as string]: hex }}
                  onClick={() => pickSwatch(id)}
                >
                  <i /><span>{label}</span>
                </button>
              ))}
            </div>
          ) : null}

          {deep && catalog === 'type' ? (
            <div className="zl-token-stage__swatches" role="group" aria-label={t('Typo-Skala', 'Type scale')}>
              <button type="button" className={`zl-token-stage__chip${typeScale === 'h1' ? ' is-active' : ''}`} aria-pressed={typeScale === 'h1'} onClick={() => { touch(); setTypeScale('h1'); triggerPulse() }}>H1</button>
              <button type="button" className={`zl-token-stage__chip${typeScale === 'body' ? ' is-active' : ''}`} aria-pressed={typeScale === 'body'} onClick={() => { touch(); setTypeScale('body'); triggerPulse() }}>Body</button>
            </div>
          ) : null}

          {deep && catalog === 'space' ? (
            <div className="zl-token-stage__swatches" role="group" aria-label={t('Abstand-Skala', 'Spacing scale')}>
              {([
                ['s', 'S'],
                ['m', 'M'],
                ['l', 'L'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`zl-token-stage__chip${spaceScale === id ? ' is-active' : ''}`}
                  aria-pressed={spaceScale === id}
                  onClick={() => { touch(); setSpaceScale(id); triggerPulse() }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="zl-token-stage__flow" aria-hidden="true"><span /><i /><span /></div>
          <div className="zl-token-stage__components">
            <button type="button" className="zl-token-stage__component zl-token-stage__component--one" onClick={() => pickCard('one')}>
              <div className="zl-token-stage__component-head">{LANDING_EXAMPLE_COMPOSITION.name} <span>{locale === 'de' ? LANDING_EXAMPLE_COMPOSITION.labelDe : LANDING_EXAMPLE_COMPOSITION.labelEn}</span></div>
              <div className="zl-token-stage__component-body"><strong>{t('Eine Idee.', 'One idea.')}<br />{t('Viele Orte.', 'Many places.')}</strong><span className="zl-token-stage__component-action">{t('Entdecken', 'Explore')} ↗</span></div>
            </button>
            <button type="button" className="zl-token-stage__component zl-token-stage__component--two" onClick={() => pickCard('two')}>
              <div className="zl-token-stage__component-head">ProductCard <span>{locale === 'de' ? LANDING_EXAMPLE_COMPOSITION.labelDe : LANDING_EXAMPLE_COMPOSITION.labelEn}</span></div>
              <div className="zl-token-stage__component-body"><strong>{t('Alles', 'Everything')}<br />{t('im Blick.', 'in view.')}</strong><span className="zl-token-stage__component-action">{t('Mehr ansehen', 'See more')} ↗</span></div>
            </button>
          </div>
          {deep ? (
            <button
              type="button"
              className="zl-token-stage__both"
              onClick={() => { touch(); setHighlight('both'); triggerPulse() }}
            >
              {t('Beide Karten hervorheben', 'Highlight both cards')}
            </button>
          ) : null}
          <div className="zl-token-stage__complete">
            {catalog === 'color'
              ? t(`Ein Pfad · ${uses} Verwendung${uses === 1 ? '' : 'en'} · ${swatchCode}`, `One path · ${uses} use${uses === 1 ? '' : 's'} · ${swatchCode}`)
              : catalog === 'type'
                ? t('Typografie gebunden — Vorschau im Editor.', 'Typography bound — preview in the editor.')
                : t('Abstand gebunden — Vorschau im Editor.', 'Spacing bound — preview in the editor.')}
          </div>
        </div>
      </div>
      <Status>
        {copied
          ? t(`Kopiert: ${activePath}`, `Copied: ${activePath}`)
          : catalog === 'color'
            ? `${swatchCode} · ${uses} ${t('Uses', 'uses')}`
            : catalog === 'type'
              ? typeLabel
              : spaceLabel}
        {!copied && highlight !== 'both' ? ` · ${highlight === 'one' ? 'FeatureCard' : 'ProductCard'}` : ''}
      </Status>
      <p className="zl-experience__hint">
        {deep
          ? t('Swatches · Skalen · Pfad kopieren · Karten.', 'Swatches · scales · copy path · cards.')
          : t('Katalog · Farbe togglen · Karten anklicken.', 'Catalog · toggle color · click cards.')}
      </p>
    </div>
  )
}

export function InteractiveScreensStage({
  locale,
  tourStep,
  onInteract,
  density = 'compact',
}: { locale: UiLocaleId; tourStep?: BreakpointId | null } & StageInteract) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  const deep = density === 'deep'
  const [breakpoint, setBreakpoint] = useState<BreakpointId>('desktop')
  const [compare, setCompare] = useState(false)
  const [chrome, setChrome] = useState(true)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [pulse, triggerPulse] = usePulse()

  useEffect(() => {
    if (tourStep) {
      setBreakpoint(tourStep)
      setCompare(false)
    }
  }, [tourStep])

  const choose = (id: BreakpointId) => {
    onInteract?.()
    setBreakpoint(id)
    setCompare(false)
    triggerPulse()
  }

  const compactOrder: BreakpointId[] = ['desktop', 'mobile']
  const cycle = () => {
    const order = deep ? BREAK_ORDER : compactOrder
    const index = order.indexOf(breakpoint === 'tablet' && !deep ? 'desktop' : breakpoint)
    const next = order[((index < 0 ? 0 : index) + 1) % order.length]
    choose(next)
  }

  const toggleCompare = () => {
    onInteract?.()
    setCompare((current) => !current)
    triggerPulse()
  }

  const widthLabel =
    breakpoint === 'desktop' ? '1440' : breakpoint === 'tablet' ? '834' : '390'

  return (
    <div
      className={`zl-experience__screens is-interactive${pulse ? ' is-pulse' : ''}${compare ? ' is-compare' : ''}${chrome ? '' : ' is-bare'}`}
      data-density={density}
      data-break={breakpoint}
      data-compare={compare ? 'true' : 'false'}
      data-chrome={chrome ? 'true' : 'false'}
      data-orientation={orientation}
    >
      <figure className="zl-experience__shot">
        <div className="zl-experience__shot-frame">
          <img
            src={paths.landing.assets.editorBreakpointsApp}
            width="1024"
            height="651"
            loading="lazy"
            alt={t(
              'Echter Zaoly Editor mit Desktop-, Tablet- und Mobile-Artboards derselben Seite nebeneinander',
              'Zaoly editor showing the same page on desktop, tablet, and mobile artboards side by side',
            )}
          />
          <div className="zl-experience__shot-zones" aria-label={t('Breakpoint-Zonen', 'Breakpoint zones')}>
            <button type="button" className={`zl-experience__shot-zone zl-experience__shot-zone--desktop${breakpoint === 'desktop' ? ' is-active' : ''}`} onClick={() => choose('desktop')}>
              <span>Desktop</span>
            </button>
            {deep ? (
              <button type="button" className={`zl-experience__shot-zone zl-experience__shot-zone--tablet${breakpoint === 'tablet' ? ' is-active' : ''}`} onClick={() => choose('tablet')}>
                <span>Tablet</span>
              </button>
            ) : <span className="zl-experience__shot-zone zl-experience__shot-zone--tablet" aria-hidden="true" />}
            <button type="button" className={`zl-experience__shot-zone zl-experience__shot-zone--mobile${breakpoint === 'mobile' ? ' is-active' : ''}`} onClick={() => choose('mobile')}>
              <span>Mobile</span>
            </button>
          </div>
        </div>
        <figcaption>
          <strong>{t('Multi-Breakpoint Compare', 'Multi-breakpoint compare')}</strong>
          <span>{t('Echte App-Ansicht · Demodaten', 'Actual app view · sample data')}</span>
        </figcaption>
      </figure>
      <div
        className="zl-break-stage is-interactive"
        data-loop="breakpoints"
        data-break={breakpoint}
        data-compare={compare ? 'true' : 'false'}
        data-orientation={orientation}
        role="group"
        aria-label={t(
          'Interaktive Breakpoint-Illustration: wechsle zwischen Desktop 1440 und Mobile 390',
          'Interactive breakpoint illustration: switch between desktop 1440 and mobile 390',
        )}
      >
        <div className="zl-break-stage__bar" aria-hidden="true"><span>ZAOLY / EDITOR</span><span>STUDIO FORM / PAGE 01</span></div>
        <div className="zl-break-stage__toolbar">
          <span aria-hidden="true">ARTBOARD</span>
          <div role="tablist" aria-label={t('Breakpoint wählen', 'Choose breakpoint')}>
            <button type="button" role="tab" className="zl-break-stage__desktop-tab" aria-selected={breakpoint === 'desktop'} onClick={() => choose('desktop')}>
              Desktop <small>1440</small>
            </button>
            {deep ? (
              <button type="button" role="tab" className="zl-break-stage__tablet-tab" aria-selected={breakpoint === 'tablet'} onClick={() => choose('tablet')}>
                Tablet <small>834</small>
              </button>
            ) : null}
            <button type="button" role="tab" className="zl-break-stage__mobile-tab" aria-selected={breakpoint === 'mobile'} onClick={() => choose('mobile')}>
              Mobile <small>390</small>
            </button>
          </div>
          {deep ? (
            <>
              <button type="button" className="zl-break-stage__compare" aria-pressed={compare} onClick={toggleCompare}>
                {compare ? t('Einzelansicht', 'Single view') : t('Vergleichen', 'Compare')}
              </button>
              <button type="button" className="zl-break-stage__compare" aria-pressed={chrome} onClick={() => { onInteract?.(); setChrome((v) => !v) }}>
                {chrome ? t('Chrome aus', 'Chrome off') : t('Chrome an', 'Chrome on')}
              </button>
              <button
                type="button"
                className="zl-break-stage__compare"
                aria-pressed={orientation === 'landscape'}
                onClick={() => {
                  onInteract?.()
                  setOrientation((v) => (v === 'portrait' ? 'landscape' : 'portrait'))
                  triggerPulse()
                }}
              >
                {orientation === 'portrait' ? t('Querformat', 'Landscape') : t('Hochformat', 'Portrait')}
              </button>
            </>
          ) : null}
        </div>
        <button
          type="button"
          className="zl-break-stage__canvas zl-break-stage__canvas--hit"
          aria-label={t('Breakpoint umschalten', 'Toggle breakpoint')}
          onClick={cycle}
        >
          <div className="zl-break-stage__page">
            <div className="zl-break-stage__desktop">
              <div className="zl-break-stage__nav"><b>STUDIO FORM</b><span>WORK &nbsp; ABOUT &nbsp; CONTACT</span></div>
              <div className="zl-break-stage__desktop-copy"><span>{t('DESIGN MIT SYSTEM', 'DESIGN WITH A SYSTEM')}</span><strong>{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</strong><p>{t('Gestaltung, die weiterdenkt.', 'Design that thinks ahead.')}</p><b>{t('Projekt entdecken', 'Explore project')} ↗</b></div>
              <div className="zl-break-stage__desktop-art"><i /><span>FORM<br />01</span></div>
              <div className="zl-break-stage__footer">SELECTED WORK <span>01 / 03</span></div>
            </div>
            <div className="zl-break-stage__tablet">
              <div className="zl-break-stage__nav"><b>STUDIO FORM</b><span>WORK · ABOUT</span></div>
              <div className="zl-break-stage__tablet-copy"><span>{t('DESIGN MIT SYSTEM', 'DESIGN WITH A SYSTEM')}</span><strong>{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</strong><p>{t('Gestaltung, die weiterdenkt.', 'Design that thinks ahead.')}</p><b>{t('Projekt entdecken', 'Explore project')} ↗</b></div>
              <div className="zl-break-stage__tablet-art"><i /><span>FORM<br />01</span></div>
              <div className="zl-break-stage__footer">SELECTED WORK <span>01 / 03</span></div>
            </div>
            <div className="zl-break-stage__mobile">
              <div className="zl-break-stage__nav"><b>STUDIO FORM</b><span>MENU ↗</span></div>
              <div className="zl-break-stage__mobile-copy"><span>{t('DESIGN MIT SYSTEM', 'DESIGN WITH A SYSTEM')}</span><strong>{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</strong><p>{t('Gestaltung, die weiterdenkt.', 'Design that thinks ahead.')}</p></div>
              <div className="zl-break-stage__mobile-art"><i /><span>FORM<br />01</span></div>
              <b className="zl-break-stage__mobile-action">{t('Projekt entdecken', 'Explore project')} ↗</b>
              <div className="zl-break-stage__footer">SELECTED WORK <span>01 / 03</span></div>
            </div>
          </div>
        </button>
      </div>
      <Status>
        {compare
          ? t('Vergleich Desktop ↔ Mobile', 'Compare Desktop ↔ Mobile')
          : `${breakpoint === 'desktop' ? 'Desktop' : breakpoint === 'tablet' ? 'Tablet' : 'Mobile'} ${widthLabel}`}
        {deep ? ` · ${orientation}` : ''}
      </Status>
      <p className="zl-experience__hint">
        {deep
          ? t('Zonen · Tabs · Vergleichen · Chrome · Orientierung.', 'Zones · tabs · compare · chrome · orientation.')
          : t('Zonen · Tabs · Illustration tippt durch die Breiten.', 'Zones · tabs · tap the illustration to cycle widths.')}
      </p>
    </div>
  )
}

export function InteractivePathStage({
  locale,
  tourStep,
  onInteract,
  density = 'compact',
}: { locale: UiLocaleId; tourStep?: PathStep | null } & StageInteract) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  const deep = density === 'deep'
  const [step, setStep] = useState<PathStep>('design')
  const [detail, setDetail] = useState<PathDetail>('none')
  const [autoplay, setAutoplay] = useState(false)
  const tabs: Array<[PathStep, string]> = [
    ['design', t('Gestalten', 'Design')],
    ['system', t('Systematisieren', 'Systemize')],
    ['code', t('Weitergeben', 'Hand off')],
  ]
  const order = tabs.map(([id]) => id)

  useEffect(() => {
    if (tourStep) {
      setStep(tourStep)
      setDetail('none')
      setAutoplay(false)
    }
  }, [tourStep])

  useEffect(() => {
    if (!autoplay || !deep) return
    const sequence: PathStep[] = ['design', 'system', 'code']
    const timer = window.setInterval(() => {
      setStep((current) => {
        const index = sequence.indexOf(current)
        if (current === 'code') {
          setAutoplay(false)
          return current
        }
        return sequence[(index + 1) % sequence.length]
      })
      setDetail('none')
    }, 1400)
    return () => window.clearInterval(timer)
  }, [autoplay, deep])

  const choose = (id: PathStep) => {
    onInteract?.()
    setAutoplay(false)
    setStep(id)
    setDetail('none')
  }

  const go = (delta: number) => {
    const index = order.indexOf(step)
    choose(order[(index + delta + order.length) % order.length])
  }

  const pickDetail = (id: PathDetail) => {
    if (!deep) return
    onInteract?.()
    setAutoplay(false)
    setDetail(id)
  }

  const example = LANDING_EXAMPLE_COMPOSITION
  const detailLabel =
    detail === 'layer'
      ? `${example.name} layer`
      : detail === 'card'
        ? example.name
        : detail === 'binding'
          ? 'color.action.primary'
          : detail === 'import'
            ? '@zaoly/site-kit'
            : detail === 'export'
              ? example.fileName
              : tabs.find(([id]) => id === step)?.[1]

  return (
    <div
      className="zl-workflow__journey is-interactive"
      data-loop="workflow"
      data-density={density}
      data-step={step}
      data-detail={detail}
      data-autoplay={autoplay ? 'true' : 'false'}
      role="group"
      aria-label={t(
        `Interaktiver Workflow: derselbe ${example.labelDe} ${example.name} von Gestaltung bis React`,
        `Interactive workflow: the same ${example.labelEn} ${example.name} from design to React`,
      )}
    >
      <div className="zl-experience__path-tabs" role="tablist" aria-label={t('Workflow-Schritte', 'Workflow steps')}>
        {tabs.map(([id, label], index) => (
          <button key={id} type="button" role="tab" aria-selected={step === id} onClick={() => choose(id)}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            {label}
          </button>
        ))}
        <div className="zl-experience__stepper zl-experience__stepper--dark" role="group" aria-label={t('Pfad schrittweise', 'Step through path')}>
          <button type="button" onClick={() => go(-1)} aria-label={t('Vorheriger Schritt', 'Previous step')}>‹</button>
          <button type="button" onClick={() => go(1)} aria-label={t('Nächster Schritt', 'Next step')}>›</button>
        </div>
        {deep ? (
          <button
            type="button"
            className="zl-workflow__autoplay"
            aria-pressed={autoplay}
            onClick={() => {
              onInteract?.()
              setAutoplay((v) => !v)
            }}
          >
            {autoplay ? t('Auto stoppen', 'Stop auto') : t('Auto abspielen', 'Play auto')}
          </button>
        ) : null}
      </div>

      {deep ? (
        <Rail
          label={t('Workflow-Fortschritt', 'Workflow progress')}
          active={step}
          onPick={(id) => choose(id as PathStep)}
          items={tabs.map(([id, label]) => ({ id, title: label, current: step === id, done: order.indexOf(id) <= order.indexOf(step) }))}
        />
      ) : null}

      <div className="zl-workflow__stage">
        <article className="zl-workflow__chapter zl-workflow__chapter--design is-active" hidden={step !== 'design'}>
          <div className="zl-workflow__scene zl-workflow__scene--canvas" role="group" aria-label={t(`${example.name} (${example.labelDe}) ist auf einem Artboard ausgewählt`, `${example.name} (${example.labelEn}) is selected on an artboard`)}>
            <div className="zl-workflow__window" aria-hidden="true"><span>Canvas</span><span>Desktop</span></div>
            <div className="zl-workflow__editor">
              <div className="zl-workflow__layers">
                <span>Page 01</span>
                <button type="button" className={detail === 'layer' ? 'is-active' : ''} onClick={() => pickDetail('layer')}>▣ &nbsp; {example.name}</button>
                <span>Text</span>
                <span>Button</span>
              </div>
              <div className="zl-workflow__artboard">
                <div className="zl-workflow__selected">
                  <span>{example.name} · {locale === 'de' ? example.labelDe : example.labelEn}</span>
                  <button type="button" className={`zl-workflow__card${detail === 'card' ? ' is-active' : ''}`} onClick={() => pickDetail('card')}>
                    <i>◇</i>
                    <strong>{locale === 'de' ? <>Eine Idee.<br />Viele Orte.</> : <>One idea.<br />Many places.</>}</strong>
                    <b>{t('Entdecken', 'Explore')} ↗</b>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="zl-workflow__chapter zl-workflow__chapter--system is-active" hidden={step !== 'system'}>
          <div className="zl-workflow__scene zl-workflow__scene--system" role="group" aria-label={t(`${example.name} (${example.labelDe}) mit Variante Primary und gebundenem Farbtoken color.action.primary`, `${example.name} (${example.labelEn}) with the Primary variant and bound color token color.action.primary`)}>
            <div className="zl-workflow__window" aria-hidden="true"><span>{example.name}</span><span>{locale === 'de' ? example.labelDe : example.labelEn}</span></div>
            <div className="zl-workflow__system-body">
              <button type="button" className={`zl-workflow__system-card${detail === 'card' ? ' is-active' : ''}`} onClick={() => pickDetail('card')}>
                <i>◇</i>
                <strong>{locale === 'de' ? <>Eine Idee.<br />Viele Orte.</> : <>One idea.<br />Many places.</>}</strong>
                <b>{t('Entdecken', 'Explore')} ↗</b>
              </button>
              <div className="zl-workflow__bindings">
                <div><span>{t('VARIANTE', 'VARIANT')}</span><strong>Primary</strong></div>
                <button type="button" className={detail === 'binding' ? 'is-active' : ''} onClick={() => pickDetail('binding')}>
                  <span>{t('FARBE', 'COLOR')}</span>
                  <strong><i />color.action.primary</strong>
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="zl-workflow__chapter zl-workflow__chapter--code is-active" hidden={step !== 'code'}>
          <div className="zl-workflow__scene zl-workflow__scene--code" role="group" aria-label={t(`React-Modul ${example.fileName} (${example.labelDe}) mit Import aus dem Zaoly Kit und einem Preflight-Hinweis`, `React module ${example.fileName} (${example.labelEn}) with an import from Zaoly Kit and a preflight note`)}>
            <div className="zl-workflow__window" aria-hidden="true"><span>{example.fileName}</span><span>React</span></div>
            <div className="zl-workflow__code-body">
              <button type="button" className={`zl-workflow__code-line${detail === 'import' ? ' is-active' : ''}`} onClick={() => pickDetail('import')}>
                <code><span>import</span> {'{'} Stack, Text, Button {'}'} <span>from</span> &apos;@zaoly/site-kit&apos;</code>
              </button>
              <code>&nbsp;</code>
              <button type="button" className={`zl-workflow__code-line${detail === 'export' ? ' is-active' : ''}`} onClick={() => pickDetail('export')}>
                <code><span>export function</span> {example.name}() {'{'} … {'}'}</code>
              </button>
              <div className="zl-workflow__code-status"><i>✓</i> {t('Preflight prüfen · React integrieren', 'Review preflight · integrate React')}</div>
            </div>
          </div>
        </article>
      </div>

      <div className="zl-workflow__footer-actions">
        <button
          type="button"
          className="zl-workflow__advance-btn"
          onClick={() => go(1)}
          aria-label={t('Nächsten Workflow-Schritt zeigen', 'Show next workflow step')}
        >
          {t('Nächster Schritt', 'Next step')} →
        </button>
      </div>

      <Status>{detailLabel}</Status>
      <p className="zl-experience__hint">
        {t(
          'Tabs · Szene-Details antippen · Weiter-Button.',
          'Tabs · tap scene details · next-step button.',
        )}
      </p>
    </div>
  )
}
