/** Illustrative Token Studio editing flows based on the local Zaoly pack. */
import type { UiLocaleId } from '../lib/user-prefs'
import { siteText } from '../lib/public-site-locale'

export function TokenColorEditVisual({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div className="zl-token-craft__color" data-loop="token-color-edit" role="img" aria-label={t('Illustration des Token Studios: color.action.primary wird im Edit-Dock vom Seed-Blau zu einem lokalen violetten Override geändert und in der Karten-Vorschau gezeigt', 'Token Studio illustration: color.action.primary changes from seed blue to a local purple override in the edit dock and appears in the card preview')}>
      <div className="zl-token-craft__window" aria-hidden="true"><span>ZAOLY / TOKEN STUDIO</span><span>COLOR</span></div>
      <div className="zl-token-craft__color-body" aria-hidden="true">
        <div className="zl-token-craft__catalog">
          <div className="zl-token-craft__catalog-top"><b>Tokens</b><span>Cards &nbsp; JSON &nbsp; CSS</span></div>
          <div className="zl-token-craft__selected-card">
          <div className="zl-token-craft__selected-head"><span>{t('FARBE', 'COLOR')}</span><b>↗</b></div>
            <div className="zl-token-craft__swatch"><span className="zl-token-craft__swatch-value"><b className="zl-token-craft__initial">#1F44FF</b><b className="zl-token-craft__changed">#7457D8</b></span></div>
            <div className="zl-token-craft__selected-foot"><strong>color.action.primary</strong><span><b className="zl-token-craft__changed">Override</b></span></div>
          </div>
          <div className="zl-token-craft__component-preview"><span>{t('GEBUNDENE VORSCHAU', 'BOUND PREVIEW')}</span><b>Primary action ↗</b></div>
        </div>
        <div className="zl-token-craft__dock">
          <span className="zl-token-craft__dock-label">EDIT DOCK</span>
          <strong>color.action.primary</strong>
          <div className="zl-token-craft__formats"><b>HEX</b><span>RGB</span><span>HSL</span><span>OKLCH</span></div>
          <small>{t('DIGITALER WERT', 'DIGITAL VALUE')}</small>
          <div className="zl-token-craft__input"><i /><b className="zl-token-craft__initial">#1F44FF</b><b className="zl-token-craft__changed">#7457D8</b></div>
          <p>{t('Kartenmedien zeigen den Entwurf direkt.', 'Card previews show your changes instantly.')}</p>
          <div className="zl-token-craft__dock-actions"><span>{t('Zurücksetzen', 'Revert')}</span><b>{t('Speichern', 'Save')}</b></div>
          <div className="zl-token-craft__saved">✓ &nbsp;{t('Lokaler Override gespeichert', 'Local override saved')}</div>
        </div>
      </div>
    </div>
  )
}

export function TokenSpacingWheelVisual({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div className="zl-token-craft__small zl-token-craft__spacing" data-loop="token-spacing-wheel" role="img" aria-label={t('Illustration des Token Studios: Das Endlos-Rad ändert spacing.static.medium von 1rem auf einen lokalen Entwurf von 1.5rem und die Karten-Vorschau zeigt den größeren Abstand', 'Token Studio illustration: the infinite wheel changes spacing.static.medium from 1rem to a local 1.5rem draft and the card preview shows the larger spacing')}>
      <div className="zl-token-craft__window" aria-hidden="true"><span>ABSTAND / EDIT DOCK</span><span>LIVE PREVIEW</span></div>
      <div className="zl-token-craft__small-body" aria-hidden="true">
        <div className="zl-token-craft__small-head"><span>spacing.static.medium</span><b className="zl-token-craft__wheel-value"><i className="zl-token-craft__initial">1rem</i><i className="zl-token-craft__changed">1.5rem</i></b></div>
        <div className="zl-token-craft__wheel"><div className="zl-token-craft__wheel-scale"><span>.5</span><span>.75</span><span>1</span><span>1.25</span><span>1.5</span><span>1.75</span><span>2</span><span>2.25</span></div><i /></div>
        <div className="zl-token-craft__spacing-preview"><span /><span /></div>
        <div className="zl-token-craft__small-foot"><span>{t('Skala bewegen · Mitte bleibt fest', 'Move scale · center stays fixed')}</span><b>{t('Wert frei eingeben', 'Enter a value')} ↗</b></div>
      </div>
    </div>
  )
}

export function TokenComposeVisual({ locale }: { locale: UiLocaleId }) {
  const t = (de: string, en: string) => siteText(locale, de, en)
  return (
    <div className="zl-token-craft__small zl-token-craft__compose" data-loop="token-compose" role="img" aria-label={t('Illustration des Token Studios: spacing.gap.modules verwendet im Digitalwert-Feld den abgeleiteten Ausdruck calc({spacing.static.medium} * 2), der mit dem Seed-Basiswert zu 2rem aufgelöst wird', 'Token Studio illustration: spacing.gap.modules uses calc({spacing.static.medium} * 2) as a derived digital value, resolved to 2rem from the seed value')}>
      <div className="zl-token-craft__window" aria-hidden="true"><span>SMART COMPOSE</span><span>DIGITALER WERT</span></div>
      <div className="zl-token-craft__small-body" aria-hidden="true">
        <div className="zl-token-craft__small-head"><span>spacing.gap.modules</span><b>{'{ }'}</b></div>
        <div className="zl-token-craft__expression">calc(<em>{'{spacing.static.medium}'}</em> * 2)</div>
        <div className="zl-token-craft__resolve"><span>Basis &nbsp; 1rem</span><i>→</i><strong>2rem</strong></div>
        <div className="zl-token-craft__compose-preview"><span /><span /></div>
        <div className="zl-token-craft__small-foot"><span>{t('Aus einem Token abgeleitet', 'Derived from a token')}</span><b>{t('Live aufgelöst', 'Resolved live')}</b></div>
      </div>
    </div>
  )
}
