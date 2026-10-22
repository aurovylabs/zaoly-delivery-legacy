'use client'

import React, { useState, useMemo, useEffect } from 'react'
import type {
  CompositionScene,
  SceneBreakpointId,
  SceneMaster,
  SceneNode,
} from '@zaoly/contracts'
import { Button, Dialog, Input, Text } from '@zaoly/ui'
import {
  compositionStoryTitle,
  generateCompositionModule,
  generateCompositionStory,
  normalizeCompositionName,
  validateCompositionName,
} from '@zaoly/site-kit/composition-codegen'
import { SITE_KIT_CATALOG } from '../../lib/site-kit/site-kit-catalog'
import {
  collectPublishableMasters,
  requestSiteKitPublishAll,
  requestSiteKitSaveComposition,
} from '../../lib/site-kit/write-client'
import {
  formatSiteKitPublishStatusMessage,
  formatSiteKitSaveCompositionStatusMessage,
} from '../../lib/site-kit/publish-status'
import {
  siteKitAtomStoryHref,
  siteKitCompositionStoryHref,
  siteKitLiveCompositionHref,
  siteKitCatalogHref,
  mintSiteKitViewCredentialsClient,
  withSiteKitViewCredentials,
} from '../../lib/site-kit/storybook-href'
import { compositionComponentId } from '@zaoly/site-kit/composition-codegen'
import { shouldShowSiteKitSaveComposition } from '../../lib/site-kit/save-composition-visibility'
import { paths, kitPlaygroundHref } from '../../lib/paths'
import { isRealPlatformProjectId } from '../../lib/platform-project-id'
import type { Translator } from '../../lib/i18n'
import type { useInspectTokenCatalog } from '../../lib/inspect/token-catalog-context'

export interface EditorStorybookDialogProps {
  open: boolean
  onClose: () => void
  scene: CompositionScene
  selectedNode: SceneNode | null
  selectedPersistedNode?: SceneNode | null
  activeBreakpoint: SceneBreakpointId
  tokenCatalog?: ReturnType<typeof useInspectTokenCatalog>
  platformProjectId?: string | null
  masterEditId?: string | null
  siteKitStorybookUrl?: string | null
  t: Translator
  onSiteKitStatus?: (message: string | null) => void
  onCompositionSaved?: (input: { masterId: string; exportName: string }) => void
}

type TabKey = 'publish' | 'promote' | 'catalog'
type PreviewFormat = 'csf' | 'tsx'

export function EditorStorybookDialog({
  open,
  onClose,
  scene,
  selectedNode,
  selectedPersistedNode,
  activeBreakpoint,
  tokenCatalog,
  platformProjectId,
  masterEditId,
  siteKitStorybookUrl,
  t,
  onSiteKitStatus,
  onCompositionSaved,
}: EditorStorybookDialogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('publish')
  const [publishBusy, setPublishBusy] = useState(false)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)
  const [publishRedeployStatus, setPublishRedeployStatus] = useState<
    'queued' | 'skipped' | 'failed' | null
  >(null)

  const [promoteName, setPromoteName] = useState('')
  const [promoteBusy, setPromoteBusy] = useState(false)
  const [promoteMessage, setPromoteMessage] = useState<string | null>(null)
  const [promotePreviewFormat, setPromotePreviewFormat] = useState<PreviewFormat>('csf')
  const [savedExportName, setSavedExportName] = useState<string | null>(null)

  const [catalogSearch, setCatalogSearch] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [savedCompositions, setSavedCompositions] = useState<
    { name: string; exportName: string; title: string }[]
  >([])
  const [viewCreds, setViewCreds] = useState<{
    viewToken: string
    platformProjectId: string
  } | null>(null)

  const storybookBaseUrl = (siteKitStorybookUrl || '').replace(/\/$/, '')

  // Determine publishable masters
  const publishableMasters = useMemo(() => {
    return collectPublishableMasters(scene.masters ?? [])
  }, [scene.masters])

  // Check if active selection can be saved/promoted as a Site Kit composition
  const canPromote = useMemo(() => {
    if (!selectedNode) return false
    return shouldShowSiteKitSaveComposition({
      selected: selectedNode,
      persisted: selectedPersistedNode ?? (selectedNode.instanceOf ? selectedNode : null),
      multi: false,
      isRoot: selectedNode.id === scene.root.id,
      sceneMasters: scene.masters,
      masterEditId: masterEditId ?? null,
    })
  }, [selectedNode, selectedPersistedNode, selectedNode?.instanceOf, scene.root.id, scene.masters, masterEditId])

  // Normalize candidate name
  const normalizedExportName = useMemo(() => {
    if (!promoteName.trim()) return ''
    return normalizeCompositionName(promoteName.trim())
  }, [promoteName])

  const nameValidation = useMemo(() => {
    if (!normalizedExportName) return null
    const res = validateCompositionName(normalizedExportName, SITE_KIT_CATALOG)
    return res.ok ? null : res
  }, [normalizedExportName])

  // Generate live CSF & TSX code preview
  const { previewCsf, previewTsx } = useMemo(() => {
    if (!selectedNode || !normalizedExportName) {
      return {
        previewCsf: '// Enter a component name to preview CSF 3.0 Story',
        previewTsx: '// Enter a component name to preview React TSX Component',
      }
    }
    try {
      const mockNode = {
        type: selectedNode.type,
        props: selectedNode.props,
        style: selectedNode.style,
        children: selectedNode.children?.map((c) => ({
          type: c.type,
          props: c.props,
          style: c.style,
        })),
      }
      const csf = generateCompositionStory(
        normalizedExportName,
        SITE_KIT_CATALOG,
        undefined,
        { platformProjectId },
      )
      const tsx = generateCompositionModule(
        normalizedExportName,
        mockNode,
        SITE_KIT_CATALOG,
      )
      return { previewCsf: csf, previewTsx: tsx }
    } catch {
      return {
        previewCsf: '// Unable to generate preview for selected node',
        previewTsx: '// Unable to generate preview for selected node',
      }
    }
  }, [selectedNode, normalizedExportName, platformProjectId])

  // Fetch saved compositions + mint Storybook view token (SK-S1)
  useEffect(() => {
    if (!open) return
    let active = true
    const collectionId = platformProjectId?.trim()
    const query = collectionId
      ? `?platformProjectId=${encodeURIComponent(collectionId)}`
      : '?unscoped=1'
    fetch(`${paths.routes.apiSiteKitCompositions}${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.compositions) return
        const list = (data.compositions as any[]).map((c) => ({
          name: c.name || c.exportName,
          exportName: c.exportName || c.name,
          title: c.title || compositionStoryTitle(c.exportName || c.name, c.platformProjectId),
        }))
        setSavedCompositions(list)
      })
      .catch(() => {
        // Fallback or ignore
      })
    void mintSiteKitViewCredentialsClient(collectionId).then((creds) => {
      if (!active) return
      setViewCreds(
        creds
          ? { viewToken: creds.viewToken, platformProjectId: creds.platformProjectId }
          : null,
      )
    })
    return () => {
      active = false
    }
  }, [open, platformProjectId])

  // Auto-switch to promote tab if opened with a promotable node selected
  useEffect(() => {
    if (open && canPromote && !promoteName) {
      setActiveTab('promote')
    }
  }, [open, canPromote, promoteName])

  const handlePublishAll = async () => {
    if (publishBusy || !publishableMasters.length) return
    if (!isRealPlatformProjectId(platformProjectId)) {
      const msg = t('editor.siteKitPublishNeedCollection')
      setPublishMessage(msg)
      onSiteKitStatus?.(msg)
      setPublishRedeployStatus('failed')
      return
    }
    setPublishBusy(true)
    setPublishMessage(null)
    try {
      const result = await requestSiteKitPublishAll({
        masters: scene.masters ?? [],
        breakpoint: activeBreakpoint,
        primaryBreakpoint:
          scene.primaryBreakpoint === 'tablet' ||
          scene.primaryBreakpoint === 'mobile' ||
          scene.primaryBreakpoint === 'desktop'
            ? scene.primaryBreakpoint
            : 'desktop',
        tokenCatalog,
        platformProjectId,
        publishLane: 'fork',
      })
      if (!result.ok) {
        const raw = result.error || ''
        const friendly =
          raw.includes('SHARED_SEED_WRITE') ||
          raw.includes('seed-write-forbidden') ||
          raw.includes('missing-platform-project-id')
            ? t('editor.siteKitPublishNeedCollection')
            : `Publish failed: ${raw}`
        setPublishMessage(friendly)
        onSiteKitStatus?.(friendly)
        setPublishRedeployStatus('failed')
        return
      }
      const msg = formatSiteKitPublishStatusMessage(result, t)
      setPublishMessage(msg)
      onSiteKitStatus?.(msg)
      if (result.storybookRedeploy?.status) {
        setPublishRedeployStatus(result.storybookRedeploy.status)
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Publish failed'
      setPublishMessage(err)
      setPublishRedeployStatus('failed')
    } finally {
      setPublishBusy(false)
    }
  }

  const handlePromoteSelection = async () => {
    if (!selectedNode || !normalizedExportName || nameValidation !== null || promoteBusy) {
      return
    }
    setPromoteBusy(true)
    setPromoteMessage(null)
    try {
      const result = await requestSiteKitSaveComposition(promoteName.trim(), selectedNode, {
        breakpoint: activeBreakpoint,
        tokenCatalog,
        masters: scene.masters,
        masterEditId: masterEditId ?? null,
        persisted: selectedPersistedNode ?? null,
        platformProjectId,
      })
      if (!result.ok) {
        const err =
          result.code === 'missing-platform-project-id'
            ? t('editor.siteKitSaveCompositionNeedCollection')
            : result.error
        setPromoteMessage(err)
        onSiteKitStatus?.(err)
        return
      }
      const msg = formatSiteKitSaveCompositionStatusMessage(result, t)
      setPromoteMessage(msg)
      onSiteKitStatus?.(msg)
      setSavedExportName(result.exportName)
      onCompositionSaved?.({
        masterId: result.masterId,
        exportName: result.exportName,
      })
      setPromoteName('')
    } catch (e) {
      const err = e instanceof Error ? e.message : t('editor.siteKitSaveCompositionFailed')
      setPromoteMessage(err)
      onSiteKitStatus?.(err)
    } finally {
      setPromoteBusy(false)
    }
  }

  const handleCopyLink = async (url: string, key: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      // Fallback
    }
  }

  // Filtered catalog
  const filteredAtoms = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim()
    if (!q) return SITE_KIT_CATALOG
    return SITE_KIT_CATALOG.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.exportName.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q),
    )
  }, [catalogSearch])

  const filteredCompositions = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim()
    if (!q) return savedCompositions
    return savedCompositions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.exportName.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q),
    )
  }, [catalogSearch, savedCompositions])

  if (!open) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('editor.siteKitCenterTitle')}
      className="creation-editor-storybook-dialog"
      data-testid="editor-storybook-dialog"
      actions={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '12px',
                background:
                  publishRedeployStatus === 'queued'
                    ? 'rgba(234, 179, 8, 0.15)'
                    : publishRedeployStatus === 'failed'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(34, 197, 94, 0.15)',
                color:
                  publishRedeployStatus === 'queued'
                    ? '#c6f24a'
                    : publishRedeployStatus === 'failed'
                    ? '#ef4444'
                    : '#22c55e',
                border:
                  publishRedeployStatus === 'queued'
                    ? '1px solid rgba(234, 179, 8, 0.3)'
                    : publishRedeployStatus === 'failed'
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid rgba(34, 197, 94, 0.3)',
              }}
              data-testid="storybook-status-badge"
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'currentColor',
                }}
              />
              {publishRedeployStatus === 'queued'
                ? t('editor.siteKitStatusQueued')
                : publishRedeployStatus === 'failed'
                ? t('editor.siteKitStatusFailed')
                : t('editor.siteKitStatusLive')}
            </span>
            <a
              href={kitPlaygroundHref({ platformProjectId: platformProjectId ?? null })}
              style={{
                fontSize: '12px',
                color: '#1f44ff',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              data-testid="kit-playground-open-link"
            >
              {t('editor.siteKitOpenPlayground')}
            </a>
            <a
              href={
                storybookBaseUrl
                  ? withSiteKitViewCredentials(
                      siteKitCatalogHref(storybookBaseUrl),
                      viewCreds,
                    )
                  : undefined
              }
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '12px',
                color: storybookBaseUrl ? '#1f44ff' : 'rgba(255,255,255,0.35)',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                pointerEvents: storybookBaseUrl ? 'auto' : 'none',
              }}
              data-testid="storybook-open-link"
            >
              {t('editor.siteKitOpenStorybook')}
            </a>
          </div>

          <Button type="button" size="sm" variant="ghost" onClick={onClose} data-testid="storybook-dialog-close">
            Close
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '680px', maxWidth: '840px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '8px', gap: '3px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('publish')}
              style={{
                background: activeTab === 'publish' ? '#1f44ff' : 'transparent',
                color: activeTab === 'publish' ? '#ffffff' : 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              data-testid="tab-storybook-publish"
            >
              {t('editor.siteKitTabPublish')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('promote')}
              style={{
                background: activeTab === 'promote' ? '#1f44ff' : 'transparent',
                color: activeTab === 'promote' ? '#ffffff' : 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              data-testid="tab-storybook-promote"
            >
              {t('editor.siteKitTabPromote')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              style={{
                background: activeTab === 'catalog' ? '#1f44ff' : 'transparent',
                color: activeTab === 'catalog' ? '#ffffff' : 'rgba(255,255,255,0.7)',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              data-testid="tab-storybook-catalog"
            >
              {t('editor.siteKitTabCatalog')}
            </button>
          </div>

          <Text role="meta" as="span" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            Coolify SSOT: {paths.coolifySiteKitStorybookUuid.slice(0, 10)}…
          </Text>
        </div>

        {/* TAB 1: Publish & Deploy */}
        {activeTab === 'publish' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="storybook-tab-publish-view">
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 71, 133, 0.08)',
                border: '1px solid rgba(255, 71, 133, 0.25)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
              data-testid="kit-playground-primary-cta"
            >
              <Text role="meta" as="p" style={{ margin: 0, fontSize: '12px', maxWidth: '28rem' }}>
                {t('editor.siteKitPlaygroundHint')}
              </Text>
              <a href={kitPlaygroundHref({ platformProjectId: platformProjectId ?? null })}>
                <Button type="button" size="sm" data-testid="kit-playground-primary-button">
                  {t('editor.siteKitOpenPlayground')}
                </Button>
              </a>
            </div>
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text as="h4" style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                  {t('editor.siteKitPublishableTitle')} ({publishableMasters.length})
                </Text>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                  Active Breakpoint: <strong>{activeBreakpoint}</strong>
                </span>
              </div>

              <Text role="meta" as="p" style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.55)' }} data-testid="site-kit-publish-lane-hint">
                {t('editor.siteKitPublishLaneHint')}
              </Text>

              {publishableMasters.length === 0 ? (
                <Text role="meta" as="p" style={{ margin: 0, color: 'rgba(255,255,255,0.5)' }}>
                  {t('editor.siteKitPublishNone')}
                </Text>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {publishableMasters.map((m) => {
                    const variantCount = m.variants?.length ?? 0
                    return (
                      <span
                        key={m.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                        }}
                      >
                        <strong>{m.name}</strong>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                          {m.root.type}
                        </span>
                        {variantCount >= 2 && (
                          <span
                            style={{
                              background: 'rgba(255, 71, 133, 0.2)',
                              color: '#1f44ff',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 600,
                            }}
                          >
                            {variantCount} variants
                          </span>
                        )}
                      </span>
                    )
                  })}
                </div>
              )}

              <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handlePublishAll}
                  disabled={
                    publishBusy ||
                    publishableMasters.length === 0 ||
                    !isRealPlatformProjectId(platformProjectId)
                  }
                  data-testid="storybook-publish-all-btn"
                  style={{ background: '#1f44ff', borderColor: '#1f44ff' }}
                >
                  {publishBusy ? t('editor.siteKitPublishBusy') : t('editor.siteKitPublishAllBtn')}
                </Button>
                {publishBusy && (
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    Triggering Coolify rebuild & writing overrides…
                  </span>
                )}
              </div>
            </div>

            {publishMessage && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.9)',
                }}
                data-testid="storybook-publish-result-msg"
              >
                {publishMessage}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Promote Selection */}
        {activeTab === 'promote' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="storybook-tab-promote-view">
            {!canPromote ? (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.12)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '24px' }}>🧩</span>
                <Text as="h4" style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                  No Unsynced Master Selected
                </Text>
                <Text role="meta" as="p" style={{ margin: 0, maxWidth: '440px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                  {t('editor.siteKitPromoteNoSelection')}
                </Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                      {t('editor.siteKitPromoteNameLabel')}
                    </label>
                    <Input
                      value={promoteName}
                      onChange={(e) => setPromoteName(e.target.value)}
                      placeholder={t('editor.siteKitSaveCompositionPlaceholder')}
                      disabled={promoteBusy}
                      data-testid="storybook-promote-name-input"
                    />
                    {normalizedExportName && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                        Export: <code style={{ color: '#1f44ff' }}>{normalizedExportName}</code>
                        {nameValidation && (
                          <span style={{ color: '#ef4444', marginLeft: '6px' }}>
                            ({nameValidation.error})
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                      {t('editor.siteKitPromoteScopeLabel')}
                    </label>
                    <div
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{platformProjectId ? `Collection: ${platformProjectId.slice(0, 8)}…` : 'Shared (Unscoped)'}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                        {platformProjectId ? 'Scoped Pattern' : 'Global Composition'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Code Preview Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => setPromotePreviewFormat('csf')}
                        style={{
                          background: promotePreviewFormat === 'csf' ? '#3f3f46' : 'transparent',
                          color: promotePreviewFormat === 'csf' ? '#fff' : 'rgba(255,255,255,0.6)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        data-testid="tab-preview-csf"
                      >
                        {t('editor.siteKitPromoteCsfPreview')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPromotePreviewFormat('tsx')}
                        style={{
                          background: promotePreviewFormat === 'tsx' ? '#3f3f46' : 'transparent',
                          color: promotePreviewFormat === 'tsx' ? '#fff' : 'rgba(255,255,255,0.6)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        data-testid="tab-preview-tsx"
                      >
                        {t('editor.siteKitPromoteTsxPreview')}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const content = promotePreviewFormat === 'csf' ? previewCsf : previewTsx
                          const filename = promotePreviewFormat === 'csf'
                            ? `${normalizedExportName || 'Component'}.stories.tsx`
                            : `${normalizedExportName || 'Component'}.tsx`
                          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = filename
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                        data-testid="download-preview-code-btn"
                      >
                        {promotePreviewFormat === 'csf' ? 'Download .stories.tsx' : 'Download .tsx'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(promotePreviewFormat === 'csf' ? previewCsf : previewTsx, 'preview-code')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedKey === 'preview-code' ? '#22c55e' : 'rgba(255,255,255,0.6)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                        data-testid="copy-preview-code-btn"
                      >
                        {copiedKey === 'preview-code' ? t('editor.siteKitLinkCopied') : 'Copy Code'}
                      </button>
                    </div>
                  </div>

                  <pre
                    style={{
                      margin: 0,
                      padding: '12px',
                      background: '#121214',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontFamily: 'ui-monospace, monospace',
                      color: '#e4e4e7',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}
                    data-testid="storybook-promote-code-preview"
                  >
                    {promotePreviewFormat === 'csf' ? previewCsf : previewTsx}
                  </pre>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handlePromoteSelection}
                    disabled={promoteBusy || !normalizedExportName || nameValidation !== null}
                    data-testid="storybook-promote-action-btn"
                    style={{ background: '#1f44ff', borderColor: '#1f44ff' }}
                  >
                    {promoteBusy ? t('editor.siteKitPublishBusy') : t('editor.siteKitPromoteAction')}
                  </Button>
                </div>

                {promoteMessage && (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    data-testid="storybook-promote-result-msg"
                  >
                    <span>{promoteMessage}</span>
                    {savedExportName && (
                      <a
                        href={withSiteKitViewCredentials(
                          siteKitLiveCompositionHref(
                            storybookBaseUrl,
                            compositionComponentId(
                              savedExportName,
                              platformProjectId,
                            ),
                          ),
                          viewCreds,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: '#1f44ff',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        data-testid="storybook-promoted-live-link"
                      >
                        {t('editor.siteKitOpenLive')} ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Component Catalog & Deep Links */}
        {activeTab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} data-testid="storybook-tab-catalog-view">
            <Input
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search components, atoms & patterns…"
              data-testid="storybook-catalog-search-input"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {/* Compositions (if any) */}
              {filteredCompositions.length > 0 && (
                <>
                  <Text role="meta" as="span" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: '#1f44ff', marginTop: '4px' }}>
                    Saved Compositions & Patterns ({filteredCompositions.length})
                  </Text>
                  {filteredCompositions.map((comp) => {
                    const storyUrl = withSiteKitViewCredentials(
                      siteKitCompositionStoryHref(storybookBaseUrl, comp.exportName, 'default', {
                        storyTitle: comp.title,
                        platformProjectId,
                      }),
                      viewCreds,
                    )
                    const liveUrl = withSiteKitViewCredentials(
                      siteKitLiveCompositionHref(
                        storybookBaseUrl,
                        compositionComponentId(comp.exportName, platformProjectId),
                      ),
                      viewCreds,
                    )
                    return (
                      <div
                        key={comp.exportName}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                        data-testid={`catalog-item-${comp.exportName}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{comp.exportName}</span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                            {comp.title}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <a
                            href={storyUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '11px',
                              color: '#1f44ff',
                              textDecoration: 'none',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(255, 71, 133, 0.1)',
                            }}
                          >
                            {t('editor.siteKitOpenStory')} ↗
                          </a>
                          <a
                            href={liveUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '11px',
                              color: 'rgba(255,255,255,0.8)',
                              textDecoration: 'none',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            {t('editor.siteKitOpenLive')} ↗
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(storyUrl, comp.exportName)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: copiedKey === comp.exportName ? '#22c55e' : 'rgba(255,255,255,0.5)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              padding: '3px 6px',
                            }}
                          >
                            {copiedKey === comp.exportName ? t('editor.siteKitLinkCopied') : t('editor.siteKitCopyLink')}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}

              {/* Core Atoms */}
              <Text role="meta" as="span" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
                Site Kit Atoms & Layout Primitives ({filteredAtoms.length})
              </Text>
              {filteredAtoms.map((atom) => {
                const storyUrl = siteKitAtomStoryHref(storybookBaseUrl, atom.title)
                return (
                  <div
                    key={atom.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    data-testid={`catalog-atom-${atom.id}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{atom.id}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                        {atom.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a
                        href={storyUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '11px',
                          color: '#1f44ff',
                          textDecoration: 'none',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 71, 133, 0.1)',
                        }}
                      >
                        {t('editor.siteKitOpenStory')} ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(storyUrl, atom.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: copiedKey === atom.id ? '#22c55e' : 'rgba(255,255,255,0.5)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: '3px 6px',
                        }}
                      >
                        {copiedKey === atom.id ? t('editor.siteKitLinkCopied') : t('editor.siteKitCopyLink')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}
