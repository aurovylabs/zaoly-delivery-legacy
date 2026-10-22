'use client'

import type { Translator } from '../../lib/i18n'
import { Button, Dialog, Field, Input, Text } from '@zaoly/ui'
import { suggestPromoteTokenPath } from '../../lib/inspect/digital-edit'
import type { InspectorPromoteDraft } from './use-inspector-promote'

export function InspectorPromoteDialog({
  draft,
  path,
  busy,
  error,
  localPreview = false,
  onPathChange,
  onClose,
  onSubmit,
  t,
}: {
  draft: InspectorPromoteDraft | null
  path: string
  busy: boolean
  error: string | null
  /** Auth-bypass fixture — session overlay, no upstream pack write. */
  localPreview?: boolean
  onPathChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
  t: Translator
}) {
  return (
    <Dialog
      open={Boolean(draft)}
      onClose={onClose}
      title={t('editor.promoteLiteralTitle')}
      className="creation-inspect-promote-dialog"
      data-testid="inspect-promote-literal-dialog"
      actions={
        <>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            data-testid="inspect-promote-cancel"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="subtle"
            disabled={busy || !path.trim()}
            data-testid="inspect-promote-submit"
            onClick={() => void onSubmit()}
          >
            {busy ? t('editor.tokenStudioSaving') : t('editor.promoteLiteralSubmit')}
          </Button>
        </>
      }
    >
      {draft ? (
        <>
          {localPreview ? (
            <Text
              role="meta"
              as="p"
              className="creation-inspect-promote-local-hint"
              data-testid="inspect-promote-local-hint"
            >
              {t('editor.promoteLiteralLocalHint')}
            </Text>
          ) : null}
          <Field label={t('editor.tokenStudioAddValue')} size="sm">
            <Input
              block
              size="sm"
              value={draft.literal}
              readOnly
              data-testid="inspect-promote-value"
              aria-label={t('editor.tokenStudioAddValue')}
            />
          </Field>
          <Field label={t('editor.tokenStudioAddPath')} size="sm">
            <Input
              block
              size="sm"
              value={path}
              onChange={(e) => onPathChange(e.target.value)}
              placeholder={suggestPromoteTokenPath(draft.type, draft.literal)}
              data-testid="inspect-promote-path"
              aria-label={t('editor.tokenStudioAddPath')}
            />
          </Field>
          {error ? (
            <Text
              role="meta"
              as="p"
              className="creation-inspect-promote-error"
              data-testid="inspect-promote-error"
            >
              {error}
            </Text>
          ) : null}
        </>
      ) : null}
    </Dialog>
  )
}
