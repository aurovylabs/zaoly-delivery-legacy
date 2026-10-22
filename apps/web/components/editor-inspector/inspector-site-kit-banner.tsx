'use client'

import type { Translator } from '../../lib/i18n'
import { useState } from 'react'
import type { SceneBreakpointId, SceneMaster, SceneNode } from '@zaoly/contracts'
import { Button, Input, Text } from '@zaoly/ui'
import { shouldShowSiteKitSaveComposition } from '../../lib/site-kit/save-composition-visibility'
import { requestSiteKitSaveComposition } from '../../lib/site-kit/write-client'
import { formatSiteKitSaveCompositionStatusMessage } from '../../lib/site-kit/publish-status'
import type { useInspectTokenCatalog } from '../../lib/inspect/token-catalog-context'

export function InspectorSiteKitBanner({
  selected,
  selectedPersisted,
  locked,
  multi,
  isRoot,
  activeBreakpoint,
  catalog,
  sceneMasters,
  masterEditId,
  platformProjectId,
  t,
  onSiteKitStatus,
  onCompositionSaved,
}: {
  selected: SceneNode
  selectedPersisted?: SceneNode | null
  locked: boolean
  multi: boolean
  isRoot: boolean
  activeBreakpoint: SceneBreakpointId
  catalog: ReturnType<typeof useInspectTokenCatalog>
  sceneMasters?: SceneMaster[]
  masterEditId?: string | null
  platformProjectId?: string | null
  t: Translator
  onSiteKitStatus?: (message: string | null) => void
  onCompositionSaved?: (input: { masterId: string; exportName: string }) => void
}) {
  const [siteKitStatus, setSiteKitStatus] = useState<string | null>(null)
  const [siteKitBusy, setSiteKitBusy] = useState(false)
  const [compositionName, setCompositionName] = useState('')

  const show = shouldShowSiteKitSaveComposition({
    selected,
    persisted: selectedPersisted ?? null,
    multi,
    isRoot,
    sceneMasters,
    masterEditId: masterEditId ?? null,
  })

  if (!show) return null

  return (
    <div className="creation-inspect-site-kit" data-testid="editor-site-kit-composition">
      <Text role="meta" as="p">
        {t('editor.siteKitSaveCompositionHint')}
      </Text>
      <Input
        value={compositionName}
        onChange={(e) => setCompositionName(e.target.value)}
        placeholder={t('editor.siteKitSaveCompositionPlaceholder')}
        disabled={locked || siteKitBusy}
        data-testid="editor-site-kit-composition-name"
      />
      <Button
        type="button"
        size="sm"
        disabled={locked || siteKitBusy || !compositionName.trim()}
        data-testid="editor-site-kit-save-composition-btn"
        onClick={() => {
          setSiteKitBusy(true)
          setSiteKitStatus(null)
          void requestSiteKitSaveComposition(compositionName.trim(), selected, {
            breakpoint: activeBreakpoint,
            tokenCatalog: catalog,
            masters: sceneMasters,
            masterEditId: masterEditId ?? null,
            persisted: selectedPersisted ?? null,
            platformProjectId,
          })
            .then((result) => {
              setSiteKitBusy(false)
              if (!result.ok) {
                const message =
                  result.code === 'missing-platform-project-id'
                    ? t('editor.siteKitSaveCompositionNeedCollection')
                    : result.error
                setSiteKitStatus(message)
                onSiteKitStatus?.(message)
                return
              }
              const message = formatSiteKitSaveCompositionStatusMessage(result, t)
              setSiteKitStatus(message)
              onSiteKitStatus?.(message)
              onCompositionSaved?.({
                masterId: result.masterId,
                exportName: result.exportName,
              })
              setCompositionName('')
            })
            .catch((err) => {
              setSiteKitBusy(false)
              const message =
                err instanceof Error ? err.message : t('editor.siteKitSaveCompositionFailed')
              setSiteKitStatus(message)
              onSiteKitStatus?.(message)
            })
        }}
      >
        {siteKitBusy ? t('editor.siteKitWriting') : t('editor.siteKitSaveComposition')}
      </Button>
      {siteKitStatus ? (
        <Text
          role="meta"
          as="p"
          className="creation-editor-status"
          data-testid="editor-site-kit-composition-status"
        >
          {siteKitStatus}
        </Text>
      ) : null}
    </div>
  )
}
