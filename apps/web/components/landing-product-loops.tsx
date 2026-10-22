/** Product-principle animations for the public landing page. These are illustrations, not app captures. */
import type { UiLocaleId } from '../lib/user-prefs'
import { siteText } from '../lib/public-site-locale'

export function TypographyLoop({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div
      className="zl-type-stage"
      data-loop="typography"
      role="img"
      aria-label={t('Illustration: Der lokale Typografie-Token typography.heading.h1 wechselt von Noto Sans JP zu einer Serif-Schrift; zwei gebundene Textkomponenten zeigen in der Editor-Vorschau die neue Schrift', 'Illustration: the local typography.heading.h1 token changes from Noto Sans JP to a serif font; two bound text components show the new font in the editor preview')}
    >
      <div className="zl-type-stage__bar" aria-hidden="true"><span>ZAOLY / TOKEN STUDIO</span><span>{t('TYPOGRAFIE', 'TYPOGRAPHY')}</span></div>
      <div className="zl-type-stage__body" aria-hidden="true">
        <div className="zl-type-stage__settings">
          <span className="zl-type-stage__path">typography.heading.h1</span>
          <div className="zl-type-stage__setting"><span>{t('Schriftfamilie', 'Font family')}</span><strong><b className="zl-type-stage__before">Noto Sans JP</b><b className="zl-type-stage__after">Serif</b></strong></div>
          <div className="zl-type-stage__setting"><span>{t('Gewicht', 'Weight')}</span><strong><b className="zl-type-stage__before">700 / Bold</b><b className="zl-type-stage__after">400 / Regular</b></strong></div>
          <div className="zl-type-stage__setting"><span>{t('Größe', 'Size')}</span><strong><b className="zl-type-stage__before">24 px</b><b className="zl-type-stage__after">42 px</b></strong></div>
          <div className="zl-type-stage__status"><i /> {t('Lokaler Beispiel-Override', 'Local sample override')}</div>
        </div>
        <div className="zl-type-stage__preview">
          <div className="zl-type-stage__preview-head"><span>EDITOR / {t('GEBUNDENE TEXTE', 'BOUND TEXT')}</span><span>{t('2 VERWENDUNGEN', '2 USES')}</span></div>
          <div className="zl-type-stage__sample zl-type-stage__sample--hero">
            <span>Landing Hero</span>
            <div className="zl-type-stage__text"><strong className="zl-type-stage__text-before">{locale === 'de' ? <>Ideen werden<br />sichtbar.</> : <>Ideas become<br />visible.</>}</strong><strong className="zl-type-stage__text-after">{locale === 'de' ? <>Ideen werden<br />sichtbar.</> : <>Ideas become<br />visible.</>}</strong></div>
            <small>STUDIO FORM / PAGE 01</small>
          </div>
          <div className="zl-type-stage__sample zl-type-stage__sample--card">
            <span>FeatureCard</span>
            <div className="zl-type-stage__text"><strong className="zl-type-stage__text-before">{t('Mehr Raum für Ideen.', 'More room for ideas.')}</strong><strong className="zl-type-stage__text-after">{t('Mehr Raum für Ideen.', 'More room for ideas.')}</strong></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CompositionLoop({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div
      className="zl-compose-stage"
      data-loop="composition"
      role="img"
      aria-label={t('Illustration: Dieselben Zaoly-Kit-Atome Text, Button und Bild werden mit Grid und Stack in zwei Landingpage-Layouts angeordnet', 'Illustration: the same Zaoly Kit atoms—Text, Button, and Image—are arranged in two landing page layouts using Grid and Stack')}
    >
      <div className="zl-compose-stage__bar" aria-hidden="true"><span>ZAOLY / EDITOR</span><span>PAGE 01</span></div>
      <div className="zl-compose-stage__body" aria-hidden="true">
        <div className="zl-compose-stage__kit">
          <strong>SITE KIT</strong>
          <div className="zl-compose-stage__atom"><span>◫</span> Text</div>
          <div className="zl-compose-stage__atom"><span>▰</span> Button</div>
          <div className="zl-compose-stage__atom"><span>▧</span> Image</div>
          <div className="zl-compose-stage__layout"><span>LAYOUT</span><b className="zl-compose-stage__grid">Grid</b><b className="zl-compose-stage__stack">Stack</b></div>
        </div>
        <div className="zl-compose-stage__canvas">
          <div className="zl-compose-stage__page">
            <div className="zl-compose-stage__nav"><b>STUDIO FORM</b><span>MENU&nbsp; ↗</span></div>
            <div className="zl-compose-stage__headline"><span>{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</span><small>{t('Gestaltung, die weiterdenkt.', 'Design that thinks ahead.')}</small></div>
            <div className="zl-compose-stage__art"><div className="zl-compose-stage__art-inner"><i /><b>FORM<br />01</b></div></div>
            <div className="zl-compose-stage__action">{t('Projekt entdecken', 'Explore project')} <span>↗</span></div>
            <div className="zl-compose-stage__footer">DESIGN MIT SYSTEM <span>01 / 03</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VariantLoop({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div
      className="zl-variant-stage"
      data-loop="variants"
      role="img"
      aria-label={t('Illustration: Eine FeatureCard wechselt im Editor zwischen den benannten Master-Varianten Default und Editorial', 'Illustration: a FeatureCard switches between the named Default and Editorial master variants in the editor')}
    >
      <div className="zl-variant-stage__bar" aria-hidden="true"><span>ZAOLY / MASTER</span><span>FEATURECARD</span></div>
      <div className="zl-variant-stage__body" aria-hidden="true">
        <div className="zl-variant-stage__inspector">
          <span className="zl-variant-stage__eyebrow">{t('KOMPONENTE', 'COMPONENT')}</span>
          <strong>FeatureCard</strong>
          <p>{locale === 'de' ? <>Ein Master.<br />Zwei Ausdrücke.</> : <>One master.<br />Two expressions.</>}</p>
          <div className="zl-variant-stage__choice"><span>{t('BENANNTE VARIANTEN', 'NAMED VARIANTS')}</span><b className="zl-variant-stage__default">Default <i>↗</i></b><b className="zl-variant-stage__editorial">Editorial <i>↗</i></b></div>
          <small>Master / Vorschau</small>
        </div>
        <div className="zl-variant-stage__canvas">
          <div className="zl-variant-stage__canvas-head"><span>EDITOR / INSTANZ</span><span>LIVE PREVIEW</span></div>
          <div className="zl-variant-stage__card zl-variant-stage__card--default">
            <div className="zl-variant-stage__art"><span>F / 01</span><i /></div>
            <div className="zl-variant-stage__card-copy"><span>STUDIO FORM</span><strong>{locale === 'de' ? <>Ideen brauchen<br />Raum.</> : <>Ideas need<br />space.</>}</strong><p>{t('Ein System für neue Perspektiven.', 'A system for new perspectives.')}</p><b>{t('Projekt entdecken', 'Explore project')} ↗</b></div>
          </div>
          <div className="zl-variant-stage__card zl-variant-stage__card--editorial">
            <div className="zl-variant-stage__card-copy"><span>STUDIO FORM / EDITORIAL</span><strong>{locale === 'de' ? <>Ideen<br /><em>brauchen</em> Raum.</> : <>Ideas<br /><em>need</em> space.</>}</strong><p>{t('Ein System für neue Perspektiven.', 'A system for new perspectives.')}</p><b>{t('Projekt entdecken', 'Explore project')} <i>↗</i></b></div>
            <div className="zl-variant-stage__art"><span>F / 01</span><i /></div>
          </div>
          <div className="zl-variant-stage__canvas-foot">FeatureCard <span>VARIANTE: <b className="zl-variant-stage__foot-default">DEFAULT</b><b className="zl-variant-stage__foot-editorial">EDITORIAL</b></span></div>
        </div>
      </div>
    </div>
  )
}

export function BreakpointLoop({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div
      className="zl-break-stage"
      data-loop="breakpoints"
      role="img"
      aria-label={t('Illustration: Dieselbe im Zaoly Editor gestaltete Landingpage wechselt zwischen den Breakpoints Desktop mit 1440 Pixeln und Mobile mit 390 Pixeln', 'Illustration: the same landing page designed in Zaoly switches between desktop at 1440 pixels and mobile at 390 pixels')}
    >
      <div className="zl-break-stage__bar" aria-hidden="true"><span>ZAOLY / EDITOR</span><span>STUDIO FORM / PAGE 01</span></div>
      <div className="zl-break-stage__toolbar" aria-hidden="true"><span>ARTBOARD</span><div><b className="zl-break-stage__desktop-tab">Desktop <small>1440</small></b><b className="zl-break-stage__mobile-tab">Mobile <small>390</small></b></div></div>
      <div className="zl-break-stage__canvas" aria-hidden="true">
        <div className="zl-break-stage__page">
          <div className="zl-break-stage__desktop">
            <div className="zl-break-stage__nav"><b>STUDIO FORM</b><span>WORK &nbsp; ABOUT &nbsp; CONTACT</span></div>
            <div className="zl-break-stage__desktop-copy"><span>{t('DESIGN MIT SYSTEM', 'DESIGN WITH A SYSTEM')}</span><strong>{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</strong><p>{t('Gestaltung, die weiterdenkt.', 'Design that thinks ahead.')}</p><b>{t('Projekt entdecken', 'Explore project')} ↗</b></div>
            <div className="zl-break-stage__desktop-art"><i /><span>FORM<br />01</span></div>
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
      </div>
    </div>
  )
}

export function EditorOverviewLoop({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div
      className="zl-editor-tour"
      data-loop="editor"
      role="img"
      aria-label={t('Illustration des Zaoly Editors mit Canvas, Seiten und Ebenen, Inspector, Kit-Komponenten, Token-Bindung, Qualitätsprüfung und React-Export', 'Illustration of the Zaoly editor with canvas, pages and layers, inspector, Kit components, token bindings, quality checks, and React export')}
    >
      <div className="zl-editor-tour__top" aria-hidden="true">
        <strong><i>造</i> ZAOLY <span>/</span> STUDIO FORM</strong>
        <div className="zl-editor-tour__modes"><b className="zl-editor-tour__mode--design">{t('Gestalten', 'Design')}</b><b className="zl-editor-tour__mode--system">{t('System', 'System')}</b><b className="zl-editor-tour__mode--check">{t('Prüfen', 'Review')}</b></div>
        <span className="zl-editor-tour__saved"><i /> {t('Gespeichert', 'Saved')}</span>
      </div>
      <div className="zl-editor-tour__body" aria-hidden="true">
        <div className="zl-editor-tour__left">
          <div className="zl-editor-tour__pane zl-editor-tour__pane--design">
            <span className="zl-editor-tour__pane-label">{t('SEITEN', 'PAGES')}</span>
            <b className="zl-editor-tour__row zl-editor-tour__row--active">▣ <span>Home</span><i>↗</i></b>
            <b className="zl-editor-tour__row">▣ <span>Contact</span></b>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">{t('EBENEN', 'LAYERS')} / HOME</span>
            <b className="zl-editor-tour__row">▤ <span>Hero</span></b>
            <b className="zl-editor-tour__row zl-editor-tour__row--inset">▧ <span>Image</span></b>
            <b className="zl-editor-tour__row zl-editor-tour__row--selected">T <span>Heading</span></b>
            <b className="zl-editor-tour__row zl-editor-tour__row--inset">▰ <span>Button</span></b>
          </div>
          <div className="zl-editor-tour__pane zl-editor-tour__pane--system">
            <span className="zl-editor-tour__pane-label">ZAOLY KIT</span>
            <b className="zl-editor-tour__row">T <span>Text</span></b>
            <b className="zl-editor-tour__row">▰ <span>Button</span></b>
            <b className="zl-editor-tour__row">▧ <span>Image</span></b>
            <b className="zl-editor-tour__row">▦ <span>Grid / Stack</span></b>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">MASTERS</span>
            <b className="zl-editor-tour__row zl-editor-tour__row--selected">◇ <span>FeatureCard</span></b>
            <b className="zl-editor-tour__row">◇ <span>SiteHeader</span></b>
          </div>
          <div className="zl-editor-tour__pane zl-editor-tour__pane--check">
            <span className="zl-editor-tour__pane-label">{t('QUALITÄT', 'QUALITY')}</span>
            <b className="zl-editor-tour__row zl-editor-tour__row--active">✓ <span>Preflight</span></b>
            <b className="zl-editor-tour__row">◷ <span>Versionen</span></b>
            <b className="zl-editor-tour__row">◌ <span>Kommentare</span></b>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">HANDOFF</span>
            <b className="zl-editor-tour__row">⌘ <span>React-Export</span></b>
            <b className="zl-editor-tour__row">↗ <span>Preview</span></b>
          </div>
        </div>
        <div className="zl-editor-tour__canvas">
          <div className="zl-editor-tour__canvas-meta"><span>HOME / DESKTOP 1440</span><span>100%</span></div>
          <div className="zl-editor-tour__artboard">
            <div className="zl-editor-tour__page-nav"><strong>STUDIO FORM</strong><span>WORK&nbsp;&nbsp; ABOUT&nbsp;&nbsp; CONTACT</span></div>
            <div className="zl-editor-tour__page-copy"><small>{t('GESTALTUNG MIT SYSTEM', 'DESIGN WITH A SYSTEM')}</small><strong>{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</strong><p>{t('Design wird zur Sprache eines Produkts.', 'Design becomes the language of a product.')}</p><b>{t('Projekt entdecken', 'Explore project')} ↗</b></div>
            <div className="zl-editor-tour__page-art"><span>FORM<br />01</span><i /></div>
            <div className="zl-editor-tour__selection"><i>Heading</i></div>
            <div className="zl-editor-tour__binding">↗ &nbsp;color.action.primary</div>
            <div className="zl-editor-tour__issue"><b>✓</b> {t('Preflight geprüft', 'Preflight checked')}</div>
            <div className="zl-editor-tour__page-foot">SELECTED WORK <span>01 / 03</span></div>
          </div>
          <div className="zl-editor-tour__canvas-foot"><span>CANVAS</span><span>DESKTOP · 1440 × 900</span></div>
        </div>
        <div className="zl-editor-tour__right">
          <div className="zl-editor-tour__pane zl-editor-tour__pane--design">
            <span className="zl-editor-tour__pane-label">INSPECT / HEADING</span>
            <strong className="zl-editor-tour__panel-title">{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</strong>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">DESIGN</span>
            <div className="zl-editor-tour__field"><span>{t('Breite', 'Width')}</span><b>Auto</b></div>
            <div className="zl-editor-tour__field"><span>{t('Größe', 'Size')}</span><b>64 px</b></div>
            <div className="zl-editor-tour__field"><span>{t('Gewicht', 'Weight')}</span><b>700</b></div>
            <div className="zl-editor-tour__field"><span>Farbe</span><b><i /> Ink</b></div>
          </div>
          <div className="zl-editor-tour__pane zl-editor-tour__pane--system">
            <span className="zl-editor-tour__pane-label">SYSTEM / FEATURECARD</span>
            <strong className="zl-editor-tour__panel-title">{locale === 'de' ? <>Gebunden.<br />Wiederverwendbar.</> : <>Bound.<br />Reusable.</>}</strong>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">VARIANTE</span>
            <div className="zl-editor-tour__field"><span>Aktiv</span><b>Editorial</b></div>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">TOKEN-PFADE</span>
            <div className="zl-editor-tour__token">typography.heading.h1</div>
            <div className="zl-editor-tour__token">color.action.primary</div>
          </div>
          <div className="zl-editor-tour__pane zl-editor-tour__pane--check">
            <span className="zl-editor-tour__pane-label">PREFLIGHT / EXPORT</span>
            <strong className="zl-editor-tour__panel-title">Bereit für<br />den nächsten Schritt.</strong>
            <div className="zl-editor-tour__check"><b>✓</b> {t('Kontrast geprüft', 'Contrast checked')}</div>
            <div className="zl-editor-tour__check"><b>✓</b> {t('Fokus-Reihenfolge', 'Focus order')}</div>
            <div className="zl-editor-tour__check"><b>✓</b> {t('Touch-Ziele', 'Touch targets')}</div>
            <span className="zl-editor-tour__pane-label zl-editor-tour__pane-label--space">REACT-HANDOFF</span>
            <div className="zl-editor-tour__export">FeatureCard.tsx <span>↗</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
