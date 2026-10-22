'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CompositionScene, SceneCraftDebugBundle } from '@zaoly/contracts'
import { Button, Dialog, Text } from '@zaoly/ui'
import { useUserPrefs } from '../lib/user-prefs'
import { paths } from '../lib/paths'
import type { ScenePreviewHtmlSource } from '../lib/scene/scene-preview-html-shared'
import { normalizeImportPreviewHtml } from '../lib/scene/scene-preview-html-shared'

type EditorHtmlPreviewDialogProps = {
  open: boolean
  onClose: () => void
  sceneId: string
  pageId: string
  baseUpdatedAt: string
  dirty: boolean
  /** When set, import tab can render without a round-trip (optional). */
  importSourceHtml?: string
  onSceneImported: (scene: CompositionScene) => void
}

type TabId = ScenePreviewHtmlSource | 'debug'

export function EditorHtmlPreviewDialog({
  open,
  onClose,
  sceneId,
  pageId,
  baseUpdatedAt,
  dirty,
  importSourceHtml,
  onSceneImported,
}: EditorHtmlPreviewDialogProps) {
  const { t } = useUserPrefs()
  const [tab, setTab] = useState<TabId>('import')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pasteHtml, setPasteHtml] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [debugJson, setDebugJson] = useState('')

  const previewUrl = useMemo(() => {
    const q = new URLSearchParams({
      pageId,
      source: tab === 'debug' ? 'scene' : tab,
      format: 'json',
    })
    return `${paths.routes.apiScenePreviewHtml(sceneId)}?${q.toString()}`
  }, [sceneId, pageId, tab])

  const craftDebugUrl = useMemo(() => {
    const q = new URLSearchParams({ pageId })
    return `${paths.routes.apiSceneCraftDebug(sceneId)}?${q.toString()}`
  }, [sceneId, pageId])

  const loadPreview = useCallback(async () => {
    if (!open) return
    setLoading(true)
    setError(null)
    try {
      if (tab === 'debug') {
        const res = await fetch(craftDebugUrl, { credentials: 'same-origin' })
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            message?: string
            error?: string
          } | null
          throw new Error(body?.message || body?.error || `HTTP ${res.status}`)
        }
        const body = (await res.json()) as {
          bundle?: SceneCraftDebugBundle
          stored?: SceneCraftDebugBundle | null
          importSourceHtmlPreview?: string | null
          craftDebugAt?: string | null
        }
        setDebugJson(
          JSON.stringify(
            {
              craftDebugAt: body.craftDebugAt ?? null,
              bundle: body.bundle,
              stored: body.stored,
              importSourceHtmlPreview: body.importSourceHtmlPreview ?? null,
            },
            null,
            2,
          ),
        )
        setHtml('')
        return
      }
      if (tab === 'import' && importSourceHtml?.trim()) {
        setHtml(normalizeImportPreviewHtml(importSourceHtml))
        return
      }
      const res = await fetch(previewUrl, { credentials: 'same-origin' })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string
          error?: string
        } | null
        if (tab === 'import' && body?.error === 'import-source-missing') {
          setHtml('')
          setError(null)
          return
        }
        throw new Error(body?.message || body?.error || `HTTP ${res.status}`)
      }
      const body = (await res.json()) as { html?: string }
      setHtml(typeof body.html === 'string' ? body.html : '')
    } catch (e) {
      setHtml('')
      setDebugJson('')
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [open, tab, importSourceHtml, previewUrl, craftDebugUrl])

  useEffect(() => {
    if (!open) return
    void loadPreview()
  }, [open, loadPreview])

  useEffect(() => {
    if (!open) {
      setPasteHtml('')
      setImportError(null)
      setConfirmReplace(false)
      setDebugJson('')
      return
    }
    if (importSourceHtml?.trim()) {
      setTab('import')
    } else {
      setTab('scene')
    }
  }, [open, importSourceHtml])

  const emptyImport = tab === 'import' && !importSourceHtml?.trim() && !loading && !html && !error

  async function runImport(replaceConfirmed: boolean) {
    const trimmed = pasteHtml.trim()
    if (!trimmed) {
      setImportError(t('editor.htmlPreviewImportPasteRequired'))
      return
    }
    if (dirty && !replaceConfirmed) {
      setConfirmReplace(true)
      return
    }
    setImportBusy(true)
    setImportError(null)
    try {
      const res = await fetch(paths.routes.apiSceneImportHtml(sceneId), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          baseUpdatedAt,
          html: trimmed,
          pageId,
          mode: 'replace-page-root',
        }),
      })
      const body = (await res.json().catch(() => null)) as {
        scene?: CompositionScene
        message?: string
        error?: string
      } | null
      if (res.status === 409) {
        setImportError(t('editor.htmlPreviewImportStale'))
        return
      }
      if (!res.ok || !body?.scene) {
        throw new Error(body?.message || body?.error || `HTTP ${res.status}`)
      }
      onSceneImported(body.scene)
      setPasteHtml('')
      setConfirmReplace(false)
      setTab('debug')
    } catch (e) {
      setImportError(e instanceof Error ? e.message : String(e))
    } finally {
      setImportBusy(false)
    }
  }

  const hint =
    tab === 'import'
      ? t('editor.htmlPreviewHintImport')
      : tab === 'scene'
        ? t('editor.htmlPreviewHintScene')
        : t('editor.htmlPreviewHintDebug')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('editor.htmlPreviewTitle')}
      className="creation-editor-html-preview-dialog"
      data-testid="editor-html-preview-dialog"
      data-resizable="true"
      actions={
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <div className="creation-editor-html-preview-dialog__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'import'}
          className={
            tab === 'import'
              ? 'creation-editor-html-preview-dialog__tab is-active'
              : 'creation-editor-html-preview-dialog__tab'
          }
          onClick={() => setTab('import')}
          data-testid="editor-html-preview-tab-import"
        >
          {t('editor.htmlPreviewTabImport')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'scene'}
          className={
            tab === 'scene'
              ? 'creation-editor-html-preview-dialog__tab is-active'
              : 'creation-editor-html-preview-dialog__tab'
          }
          onClick={() => setTab('scene')}
          data-testid="editor-html-preview-tab-scene"
        >
          {t('editor.htmlPreviewTabScene')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'debug'}
          className={
            tab === 'debug'
              ? 'creation-editor-html-preview-dialog__tab is-active'
              : 'creation-editor-html-preview-dialog__tab'
          }
          onClick={() => setTab('debug')}
          data-testid="editor-html-preview-tab-debug"
        >
          {t('editor.htmlPreviewTabDebug')}
        </button>
      </div>
      <Text role="meta" as="p" className="creation-editor-html-preview-dialog__hint">
        {hint}
      </Text>
      {loading ? (
        <Text role="body" as="p">{t('editor.htmlPreviewLoading')}</Text>
      ) : error ? (
        <Text role="body" as="p" className="creation-editor-html-preview-dialog__error">
          {error}
        </Text>
      ) : tab === 'debug' ? (
        <pre
          className="creation-editor-html-preview-dialog__debug"
          data-testid="editor-html-preview-debug"
        >
          {debugJson || '{}'}
        </pre>
      ) : emptyImport ? (
        <div className="creation-editor-html-preview-dialog__import-panel">
          <Text role="body" as="p">{t('editor.htmlPreviewImportEmpty')}</Text>
          <label className="creation-editor-html-preview-dialog__paste-label">
            <Text role="meta" as="span">{t('editor.htmlPreviewImportPasteLabel')}</Text>
            <textarea
              className="creation-editor-html-preview-dialog__paste"
              value={pasteHtml}
              onChange={(e) => setPasteHtml(e.target.value)}
              placeholder={t('editor.htmlPreviewImportPastePlaceholder')}
              spellCheck={false}
              data-testid="editor-html-import-paste"
            />
          </label>
          {confirmReplace ? (
            <Text role="meta" as="p" className="creation-editor-html-preview-dialog__confirm">
              {t('editor.htmlPreviewImportConfirmReplace')}
            </Text>
          ) : null}
          {importError ? (
            <Text role="body" as="p" className="creation-editor-html-preview-dialog__error">
              {importError}
            </Text>
          ) : null}
          <div className="creation-editor-html-preview-dialog__import-actions">
            {confirmReplace ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={importBusy}
                  onClick={() => setConfirmReplace(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={importBusy}
                  onClick={() => void runImport(true)}
                  data-testid="editor-html-import-confirm"
                >
                  {importBusy ? t('editor.htmlPreviewImportBusy') : t('editor.htmlPreviewImportConfirmAction')}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="primary"
                disabled={importBusy || !pasteHtml.trim()}
                onClick={() => void runImport(false)}
                data-testid="editor-html-import-submit"
              >
                {importBusy ? t('editor.htmlPreviewImportBusy') : t('editor.htmlPreviewImportAction')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <iframe
          title={t('editor.htmlPreviewTitle')}
          className="creation-editor-html-preview-dialog__frame"
          sandbox="allow-same-origin"
          srcDoc={html}
          data-testid="editor-html-preview-frame"
        />
      )}
    </Dialog>
  )
}
