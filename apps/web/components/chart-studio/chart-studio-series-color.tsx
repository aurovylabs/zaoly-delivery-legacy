'use client'

import { useMemo, useState } from 'react'
import { TokenPicker, type TokenPickerOption } from '@zaoly/ui'
import { useInspectTokenCatalog } from '../../lib/inspect/token-catalog-context'
import {
  previewForBinding,
  tokenDisplayLabel,
  tokensForGroup,
} from '../../lib/inspect/token-catalog'
import { loadTokenRecent, saveTokenRecent } from '../../lib/inspect/token-recent'
import { chartStudioFieldIcon } from '../../lib/chart-studio/field-icons'
import { INSPECT_UNSET_PLACEHOLDER } from '../../lib/inspect/field-catalog'

/** Color TokenPicker matching Inspect Field+icon chrome. */
export function ChartStudioSeriesColorCell({
  color,
  colorToken,
  onChange,
  onClear,
  t,
  testId,
}: {
  color?: string
  colorToken?: string
  onChange: (next: { color?: string; colorToken?: string }) => void
  onClear: () => void
  t: (key: string) => string
  testId: string
}) {
  const catalog = useInspectTokenCatalog()
  const [recentPaths, setRecentPaths] = useState(() => loadTokenRecent())
  const label = t('editor.chartStudioColColor')

  const options: TokenPickerOption[] = useMemo(() => {
    return tokensForGroup('color', catalog).map((tok) => {
      const preview = previewForBinding(tok, 'color') ?? tok.preview
      return {
        path: tok.path,
        label: tokenDisplayLabel(tok),
        valueLabel: preview,
        swatch: preview,
        preview,
      }
    })
  }, [catalog])

  return (
    <div className="creation-chart-studio__color" data-testid={testId}>
      <TokenPicker
        label={label}
        icon={chartStudioFieldIcon('color')}
        browser
        allowCycle
        allowLiteral
        allowNone
        variant="compact"
        previewKind="color"
        options={options}
        value={colorToken ?? ''}
        literalValue={colorToken ? '' : color ?? ''}
        literalPlaceholder={INSPECT_UNSET_PLACEHOLDER}
        noneLabel={t('editor.tokenNone')}
        emptyLabel={t('editor.tokenEmpty')}
        clearLabel={t('editor.clearToken')}
        recentPaths={recentPaths}
        onRecentPathsChange={(paths) => {
          setRecentPaths(paths)
          saveTokenRecent(paths)
        }}
        onChange={(path) => {
          const tok = catalog.find((t) => t.path === path)
          const css = tok ? previewForBinding(tok, 'color') : undefined
          onChange({
            colorToken: path,
            ...(css ? { color: css } : {}),
          })
        }}
        onLiteralChange={(raw) => {
          const next = raw.trim()
          if (!next) {
            onClear()
            return
          }
          onChange({ color: next })
        }}
        onClear={onClear}
        aria-label={label}
      />
    </div>
  )
}
