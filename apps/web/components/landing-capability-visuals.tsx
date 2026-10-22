/** Small editorial product illustrations for the four editor capabilities. */
import type { UiLocaleId } from '../lib/user-prefs'
import { siteText } from '../lib/public-site-locale'

export function DesignCapabilityVisual({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div className="zl-cap-visual zl-cap-visual--design" data-loop="capability-design" role="img" aria-label={t('Illustration: Im Editor werden die Ebenen einer Seite ausgewählt und das passende Element auf dem Canvas hervorgehoben', 'Illustration: select a page layer in the editor and see the matching element highlighted on the canvas')}>
      <div className="zl-cap-visual__bar" aria-hidden="true"><span>HOME / CANVAS</span><span>DESKTOP 1440</span></div>
      <div className="zl-cap-design" aria-hidden="true">
        <div className="zl-cap-design__layers"><b>{t('SEITEN', 'PAGES')}</b><span>▣ &nbsp;Home</span><b>{t('EBENEN', 'LAYERS')}</b><span>▤ &nbsp;Hero</span><span className="zl-cap-design__layer">T &nbsp;{t('Überschrift', 'Heading')}</span><span>▰ &nbsp;Button</span></div>
        <div className="zl-cap-design__canvas"><div className="zl-cap-design__page"><small>STUDIO FORM</small><strong>{locale === 'de' ? <>Neue Räume<br />für Ideen.</> : <>New spaces<br />for ideas.</>}</strong><i>{t('Projekt entdecken', 'Explore project')} ↗</i><em /></div></div>
      </div>
    </div>
  )
}

export function SystemCapabilityVisual({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div className="zl-cap-visual zl-cap-visual--system" data-loop="capability-system" role="img" aria-label={t('Illustration: Kit-Atome werden als FeatureCard-Master mit benannter Variante und Farbtoken im Editor verwendet', 'Illustration: Kit atoms are used in the editor as a FeatureCard master with a named variant and color token')}>
      <div className="zl-cap-visual__bar" aria-hidden="true"><span>ZAOLY KIT / MASTER</span><span>FEATURECARD</span></div>
      <div className="zl-cap-system" aria-hidden="true">
        <div className="zl-cap-system__atoms"><span>Text</span><span>Button</span><span>Image</span></div>
        <div className="zl-cap-system__card"><div className="zl-cap-system__art">F / 01</div><div><small>STUDIO FORM</small><strong>{locale === 'de' ? <>Ideen brauchen<br />Raum.</> : <>Ideas need<br />space.</>}</strong><b>{t('Entdecken', 'Explore')} ↗</b></div></div>
        <div className="zl-cap-system__foot"><span>VARIANTE <b>Editorial</b></span><span><i /> color.action.primary</span></div>
      </div>
    </div>
  )
}

export function CollaborationCapabilityVisual({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div className="zl-cap-visual zl-cap-visual--team" data-loop="capability-team" role="img" aria-label={t('Illustration: Team-Präsenz, ein Kommentar am Entwurf und ein benannter Versionsstand sind im Editor sichtbar', 'Illustration: team presence, a comment on the design, and a named version are visible in the editor')}>
      <div className="zl-cap-visual__bar" aria-hidden="true"><span>STUDIO FORM / TEAM</span><span>2 IM ENTWURF</span></div>
      <div className="zl-cap-team" aria-hidden="true">
        <div className="zl-cap-team__page"><span>STUDIO FORM</span><strong>{locale === 'de' ? <>Ideen brauchen<br />Raum.</> : <>Ideas need<br />space.</>}</strong><i /></div>
        <div className="zl-cap-team__presence"><b>AL</b><b>MR</b><span>{t('Zusammen im Entwurf', 'Together in the design')}</span></div>
        <div className="zl-cap-team__cursor">↖ <span>Mara</span></div>
        <div className="zl-cap-team__comment"><b>{t('Kommentar', 'Comment')}</b><span>{t('Typografie hier prüfen.', 'Review typography here.')}</span></div>
        <div className="zl-cap-team__version"><span>◷ &nbsp;{t('VERSION', 'VERSION')}</span><b>Hero – Review 01</b><i>{t('Gesichert', 'Saved')}</i></div>
      </div>
    </div>
  )
}

export function HandoffCapabilityVisual({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div className="zl-cap-visual zl-cap-visual--handoff" data-loop="capability-handoff" role="img" aria-label={t('Illustration: Der Editor prüft einen Entwurf im Preflight und zeigt danach ein React-Modul für den Handoff', 'Illustration: the editor checks a design in Preflight, then shows a React module for handoff')}>
      <div className="zl-cap-visual__bar" aria-hidden="true"><span>PREFLIGHT / EXPORT</span><span>FEATURECARD</span></div>
      <div className="zl-cap-handoff" aria-hidden="true">
        <div className="zl-cap-handoff__checks"><b>{t('QUALITÄT', 'QUALITY')}</b><span><i>✓</i> {t('Kontrast', 'Contrast')}</span><span><i>✓</i> {t('Fokus-Reihenfolge', 'Focus order')}</span><span><i>✓</i> {t('Touch-Ziele', 'Touch targets')}</span></div>
        <div className="zl-cap-handoff__code"><span>FeatureCard.tsx</span><code><i>import</i> {'{'} Stack, Text {'}'}<br /><i>from</i> &apos;@zaoly/site-kit&apos;<br /><br /><b>export function</b><br />FeatureCard() {'{'} … {'}'}</code><strong>{t('Bereit für React', 'Ready for React')} <i>↗</i></strong></div>
      </div>
    </div>
  )
}
