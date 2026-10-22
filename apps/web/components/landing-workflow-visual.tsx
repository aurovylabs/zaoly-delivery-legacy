import type { UiLocaleId } from '../lib/user-prefs'
import { siteText } from '../lib/public-site-locale'

export function WorkflowVisual({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div className="zl-workflow__journey" data-loop="workflow" aria-label={t('Workflow: dieselbe FeatureCard wird gestaltet, systematisiert und als React-Modul weitergegeben', 'Workflow: the same FeatureCard is designed, systemized, and handed off as a React module')}>
      <article className="zl-workflow__chapter zl-workflow__chapter--design">
        <div className="zl-workflow__chapter-heading"><span>01</span><h3>{t('Gestalten', 'Design')}</h3></div>
        <div className="zl-workflow__scene zl-workflow__scene--canvas" role="img" aria-label={t('FeatureCard ist auf einem Artboard ausgewählt', 'FeatureCard is selected on an artboard')}>
          <div className="zl-workflow__window" aria-hidden="true"><span>Canvas</span><span>Desktop</span></div>
          <div className="zl-workflow__editor" aria-hidden="true">
            <div className="zl-workflow__layers"><span>Page 01</span><b>▣ &nbsp; FeatureCard</b><span>Text</span><span>Button</span></div>
            <div className="zl-workflow__artboard">
              <div className="zl-workflow__selected"><span>FeatureCard</span><div className="zl-workflow__card"><i>◇</i><strong>{locale === 'de' ? <>Eine Idee.<br />Viele Orte.</> : <>One idea.<br />Many places.</>}</strong><b>{t('Entdecken', 'Explore')} ↗</b></div></div>
            </div>
          </div>
        </div>
        <p>{t('Direkt auf dem Canvas entsteht ein Baustein mit Struktur und Layout.', 'Build a structured component and layout directly on the canvas.')}</p>
      </article>

      <article className="zl-workflow__chapter zl-workflow__chapter--system">
        <div className="zl-workflow__chapter-heading"><span>02</span><h3>{t('Systematisieren', 'Systemize')}</h3></div>
        <div className="zl-workflow__scene zl-workflow__scene--system" role="img" aria-label={t('FeatureCard-Master mit Variante Primary und gebundenem Farbtoken color.action.primary', 'FeatureCard master with the Primary variant and bound color token color.action.primary')}>
          <div className="zl-workflow__window" aria-hidden="true"><span>FeatureCard</span><span>Master</span></div>
          <div className="zl-workflow__system-body" aria-hidden="true">
            <div className="zl-workflow__system-card"><i>◇</i><strong>{locale === 'de' ? <>Eine Idee.<br />Viele Orte.</> : <>One idea.<br />Many places.</>}</strong><b>{t('Entdecken', 'Explore')} ↗</b></div>
            <div className="zl-workflow__bindings"><div><span>{t('VARIANTE', 'VARIANT')}</span><strong>Primary</strong></div><div><span>{t('FARBE', 'COLOR')}</span><strong><i />color.action.primary</strong></div></div>
          </div>
        </div>
        <p>{t('Master, Varianten und Tokens machen den Entwurf wiederverwendbar.', 'Masters, variants, and tokens make the design reusable.')}</p>
      </article>

      <article className="zl-workflow__chapter zl-workflow__chapter--code">
        <div className="zl-workflow__chapter-heading"><span>03</span><h3>{t('Weitergeben', 'Hand off')}</h3></div>
        <div className="zl-workflow__scene zl-workflow__scene--code" role="img" aria-label={t('React-Modul FeatureCard.tsx mit Import aus dem Zaoly Kit und einem Preflight-Hinweis', 'React module FeatureCard.tsx with an import from Zaoly Kit and a preflight note')}>
          <div className="zl-workflow__window" aria-hidden="true"><span>FeatureCard.tsx</span><span>React</span></div>
          <div className="zl-workflow__code-body" aria-hidden="true">
            <code><span>import</span> {'{'} Stack, Text, Button {'}'}</code>
            <code><span>from</span> &apos;@zaoly/site-kit&apos;</code>
            <code>&nbsp;</code>
            <code><span>export function</span> FeatureCard() {'{'}</code>
            <code>&nbsp; <span>return</span> &lt;Stack&gt;…&lt;/Stack&gt;</code>
            <code>{'}'}</code>
            <div className="zl-workflow__code-status"><i>✓</i> {t('Preflight prüfen · React integrieren', 'Review preflight · integrate React')}</div>
          </div>
        </div>
        <p>{t('React-Code und Prüfhinweise geben dem Team einen konkreten Startpunkt.', 'React code and review notes give the team a concrete starting point.')}</p>
      </article>
    </div>
  )
}
