'use client'

import { Button, InspectSection, Text } from '@zaoly/ui'
import { peekResolvedCss } from '../../lib/inspect/css-peek'

type CssPeek = ReturnType<typeof peekResolvedCss>

export function InspectorCssPanel({
  cssPeek,
  cssCopied,
  onCopy,
  t,
}: {
  cssPeek: CssPeek
  cssCopied: boolean
  onCopy: () => void
  t: (key: string) => string
}) {
  return (
    <div className="creation-inspect-css" data-testid="editor-inspect-css">
      {cssPeek.styles.length === 0 && cssPeek.attrs.length === 0 ? (
        <div className="creation-inspect-css__empty" data-testid="editor-inspect-css-empty">
          <Text role="meta" as="p">
            {t('editor.inspectCssEmpty')}
          </Text>
        </div>
      ) : (
        <>
          <div className="creation-inspect-css__toolbar">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onCopy}
              data-testid="editor-inspect-css-copy"
              aria-label={t('editor.inspectCssCopy')}
              title={t('editor.inspectCssCopy')}
            >
              {cssCopied ? t('editor.inspectCssCopied') : t('editor.inspectCssCopy')}
            </Button>
          </div>
          <InspectSection title={t('editor.inspectCssStyles')} titleId="creation-inspect-css-styles">
            {cssPeek.styles.length === 0 ? (
              <Text role="meta" as="p">
                {t('editor.inspectCssEmpty')}
              </Text>
            ) : (
              <dl className="creation-inspect-css__list">
                {cssPeek.styles.map((row) => (
                  <div key={row.key} className="creation-inspect-css__row">
                    <dt>{row.key}</dt>
                    <dd>
                      <code>{row.value}</code>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </InspectSection>
          <InspectSection title={t('editor.inspectCssAttrs')} titleId="creation-inspect-css-attrs">
            {cssPeek.attrs.length === 0 ? (
              <Text role="meta" as="p">
                {t('editor.inspectCssEmpty')}
              </Text>
            ) : (
              <dl className="creation-inspect-css__list">
                {cssPeek.attrs.map((row) => (
                  <div key={row.key} className="creation-inspect-css__row">
                    <dt>{row.key}</dt>
                    <dd>
                      <code>{row.value}</code>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </InspectSection>
        </>
      )}
    </div>
  )
}
