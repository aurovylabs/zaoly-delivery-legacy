'use client'

import { useMemo } from 'react'
import {
  Button,
  IconArrowDown,
  IconCode,
  IconDownload,
  IconImage,
  IconImport,
  IconLink,
  IconColumns,
  IconMaximize,
  IconMessage,
  IconRedo,
  IconSave,
  IconScanSearch,
  IconShare,
  IconStorybook,
  IconUndo,
  IconZoomIn,
  IconZoomOut,
  Text,
  type ContextMenuItem,
} from '@zaoly/ui'
import type { PrintPresetId } from '@zaoly/contracts'
import { paths, kitPlaygroundHref } from '../../lib/paths'
import { type EditorBreakpoint } from '../../lib/scene/breakpoints'
import type { SceneHistory } from '../../lib/scene/history'
import { canRedo, canUndo } from '../../lib/scene/history'
import { EditorToolbarMenu } from './editor-toolbar-menu'
import { EditorBrandMark } from './brand-mark'
import { ChromeTip } from '../chrome-tip'
import { openSiteKitStorybookCatalog } from '../../lib/site-kit/storybook-href'

export type EditorToolbarProps = {
  t: (key: string, params?: Record<string, string>) => string
  history: SceneHistory
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  dirty: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  pdfBusy: boolean
  exportBusy?: boolean
  onDownloadPdf: () => void
  onSurfaceExport?: (format: 'png' | 'pdf', scope?: 'active' | 'all') => void
  onHtmlPreviewOpen: () => void
  onCodeExportOpen: () => void
  onSavePageAsPattern?: (opts?: { allPages?: boolean; pageId?: string }) => void
  onAssetLibraryOpen?: () => void
  linterOpen: boolean
  onLinterToggle: () => void
  commentsOpen: boolean
  onCommentsToggle: () => void
  publishBusy: boolean
  pullableMasterCount: number
  publishableMasterCount: number
  onPullFromSiteKit: (mode: 'pull' | 'reset') => void
  onPublishToStorybook: () => void
  onShareInvite?: () => void
  shareInviteBusy?: boolean
  onOpenClientShare?: () => void
  onOpenStorybookCenter?: () => void
  siteKitStorybook: string | null
  /** Active Collection — SK-S3 scoped Storybook open. */
  platformProjectId?: string | null
  activeBreakpoint: EditorBreakpoint
  breakpointCompareMode?: boolean
  onBreakpointCompareToggle?: () => void
  activePrintPreset: PrintPresetId
  onPrintPresetChange: (value: string) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onFitCanvas: () => void
  collectionBound?: boolean
}

export function EditorToolbarTools({
  t,
  history,
  saveState,
  dirty,
  onUndo,
  onRedo,
  onSave,
  exportBusy = false,
  onSurfaceExport,
  onHtmlPreviewOpen,
  onCodeExportOpen,
  onSavePageAsPattern,
  collectionBound,
  publishBusy,
  pullableMasterCount,
  publishableMasterCount,
  onPullFromSiteKit,
  onPublishToStorybook,
  onShareInvite,
  shareInviteBusy,
  onOpenClientShare,
  onOpenStorybookCenter,
  siteKitStorybook,
  platformProjectId,
}: Pick<
  EditorToolbarProps,
  | 't'
  | 'history'
  | 'saveState'
  | 'dirty'
  | 'onUndo'
  | 'onRedo'
  | 'onSave'
  | 'exportBusy'
  | 'onSurfaceExport'
  | 'onHtmlPreviewOpen'
  | 'onCodeExportOpen'
  | 'onSavePageAsPattern'
  | 'collectionBound'
  | 'publishBusy'
  | 'pullableMasterCount'
  | 'publishableMasterCount'
  | 'onPullFromSiteKit'
  | 'onPublishToStorybook'
  | 'onShareInvite'
  | 'shareInviteBusy'
  | 'onOpenClientShare'
  | 'onOpenStorybookCenter'
  | 'siteKitStorybook'
  | 'platformProjectId'
>) {
  const exportItems = useMemo((): ContextMenuItem[] => {
    const exportLocked = exportBusy
    const items: ContextMenuItem[] = []
    if (onSurfaceExport) {
      items.push(
        {
          id: 'export-png',
          label: exportBusy ? t('editor.surfaceExportPngBusy') : t('editor.surfaceExportPng'),
          icon: <IconImage />,
          disabled: exportLocked,
          testId: 'editor-export-png',
          onSelect: () => onSurfaceExport('png', 'active'),
        },
        {
          id: 'export-pdf',
          label: exportBusy ? t('editor.surfaceExportPdfBusy') : t('editor.surfaceExportPdf'),
          icon: <IconDownload />,
          disabled: exportLocked,
          testId: 'editor-export-pdf',
          onSelect: () => onSurfaceExport('pdf', 'all'),
        },
      )
    }
    // Magazin PDF out of scope (`print-out-of-scope-for-zaoly.md`). Surface PNG/PDF remain.
    items.push(
      {
        id: 'html',
        label: t('editor.htmlPreviewToggle'),
        icon: <IconImport />,
        testId: 'editor-html-preview-toggle',
        onSelect: onHtmlPreviewOpen,
      },
      {
        id: 'code',
        label: t('editor.codeExportToggle'),
        icon: <IconCode />,
        testId: 'editor-code-export-toggle',
        onSelect: onCodeExportOpen,
      },
    )
    if (onSavePageAsPattern) {
      items.push(
        {
          id: 'save-page-pattern',
          label: publishBusy
            ? t('editor.savePageAsPatternBusy')
            : t('editor.savePageAsPattern'),
          icon: <IconSave />,
          disabled: !collectionBound || publishBusy,
          testId: 'editor-save-page-as-pattern',
          onSelect: () => onSavePageAsPattern(),
        },
        {
          id: 'save-all-page-patterns',
          label: publishBusy
            ? t('editor.savePageAsPatternBusy')
            : t('editor.saveAllPagesAsPatterns'),
          icon: <IconSave />,
          disabled: !collectionBound || publishBusy,
          testId: 'editor-save-all-pages-as-patterns',
          onSelect: () => onSavePageAsPattern({ allPages: true }),
        },
      )
    }
    return items
  }, [
    collectionBound,
    exportBusy,
    onCodeExportOpen,
    onHtmlPreviewOpen,
    onSavePageAsPattern,
    onSurfaceExport,
    publishBusy,
    t,
  ])

  const siteKitItems = useMemo((): ContextMenuItem[] => {
    const shareDisabled = !onOpenClientShare && !onShareInvite
    const storybookDisabled = !onOpenStorybookCenter && !siteKitStorybook
    const items: ContextMenuItem[] = []
    // Share needs a bound Collection; omit when unbound (bind is Inspect — no stub row).
    if (collectionBound) {
      items.push({
        id: 'share',
        label: t('editor.shareMenuTitle'),
        icon: <IconLink />,
        disabled: Boolean(shareDisabled),
        testId: 'editor-share-menu',
        onSelect: () => {
          if (onOpenClientShare) {
            onOpenClientShare()
            return
          }
          onShareInvite?.()
        },
      })
    }
    items.push(
      {
        id: 'pull',
        label: publishBusy ? t('editor.siteKitPullBusy') : t('editor.siteKitPull'),
        icon: <IconArrowDown />,
        disabled: publishBusy || pullableMasterCount === 0,
        testId: 'editor-site-kit-pull',
        onSelect: () => {
          void onPullFromSiteKit('pull')
        },
      },
      {
        id: 'reset',
        label: t('editor.siteKitReset'),
        disabled: publishBusy || pullableMasterCount === 0,
        danger: true,
        separator: true,
        testId: 'editor-site-kit-reset',
        onSelect: () => {
          void onPullFromSiteKit('reset')
        },
      },
      {
        id: 'publish',
        label: publishBusy ? t('editor.siteKitPublishBusy') : t('editor.siteKitPublish'),
        icon: <IconShare />,
        disabled:
          publishBusy || publishableMasterCount === 0 || !collectionBound,
        testId: 'editor-site-kit-publish',
        onSelect: onPublishToStorybook,
      },
      {
        id: 'kit-playground',
        label: t('editor.siteKitOpenPlayground'),
        icon: <IconCode size={17} />,
        separator: true,
        testId: 'editor-open-kit-playground',
        onSelect: () => {
          window.location.assign(
            kitPlaygroundHref({ platformProjectId: platformProjectId ?? null }),
          )
        },
      },
      {
        id: 'storybook',
        label: onOpenStorybookCenter
          ? t('editor.siteKitCenterTitle')
          : siteKitStorybook
            ? t('editor.openStorybook')
            : t('editor.siteKitStorybookUnset', { key: paths.envSiteKitStorybook }),
        icon: <IconStorybook size={17} />,
        disabled: storybookDisabled,
        testId: 'editor-open-storybook',
        onSelect: () => {
          if (onOpenStorybookCenter) {
            onOpenStorybookCenter()
            return
          }
          if (siteKitStorybook) {
            void openSiteKitStorybookCatalog({
              storybookOrigin: siteKitStorybook,
              platformProjectId,
            })
          }
        },
      },
    )
    return items
  }, [
    collectionBound,
    onOpenStorybookCenter,
    onPublishToStorybook,
    onPullFromSiteKit,
    onShareInvite,
    onOpenClientShare,
    platformProjectId,
    publishBusy,
    publishableMasterCount,
    pullableMasterCount,
    shareInviteBusy,
    siteKitStorybook,
    t,
  ])

  return (
    <div className="creation-editor-toolbar__tools" data-testid="editor-topbar-tools">
      <ChromeTip tip={t('editor.undoShortcut')}>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canUndo(history)}
          onClick={onUndo}
          icon={<IconUndo />}
          data-testid="editor-undo"
        />
      </ChromeTip>
      <ChromeTip tip={t('editor.redoShortcut')}>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canRedo(history)}
          onClick={onRedo}
          icon={<IconRedo />}
          data-testid="editor-redo"
        />
      </ChromeTip>
      <ChromeTip tip={saveState === 'saving' ? t('editor.saving') : t('editor.saveShortcut')}>
        <Button
          type="button"
          size="sm"
          icon={<IconSave />}
          onClick={onSave}
          disabled={saveState === 'saving'}
          data-testid="editor-save"
          data-dirty={dirty ? 'true' : 'false'}
          data-save-state={saveState}
        />
      </ChromeTip>
      <EditorToolbarMenu
        label={t('editor.menuExport')}
        icon={<IconDownload />}
        items={exportItems}
        testId="editor-topbar-menu-export"
      />
      <EditorToolbarMenu
        label={t('editor.menuSiteKit')}
        icon={<IconShare />}
        items={siteKitItems}
        testId="editor-topbar-menu-site-kit"
      />
    </div>
  )
}

export function EditorToolbarActions({
  t,
  onAssetLibraryOpen,
  linterOpen,
  onLinterToggle,
  commentsOpen,
  onCommentsToggle,
  breakpointCompareMode = false,
  onBreakpointCompareToggle,
}: Pick<
  EditorToolbarProps,
  | 't'
  | 'onAssetLibraryOpen'
  | 'linterOpen'
  | 'onLinterToggle'
  | 'commentsOpen'
  | 'onCommentsToggle'
  | 'breakpointCompareMode'
  | 'onBreakpointCompareToggle'
>) {
  const reviewItems = useMemo((): ContextMenuItem[] => {
    const items: ContextMenuItem[] = []
    if (onAssetLibraryOpen) {
      items.push({
        id: 'assets',
        label: t('editor.assetLibrary'),
        icon: <IconImage />,
        testId: 'editor-asset-library-toggle',
        onSelect: onAssetLibraryOpen,
      })
    }
    items.push(
      {
        id: 'linter',
        label: t('editor.linterToggle'),
        icon: <IconScanSearch />,
        testId: 'editor-linter-toggle',
        onSelect: onLinterToggle,
      },
      {
        id: 'comments',
        label: t('editor.commentsToggle'),
        icon: <IconMessage />,
        testId: 'editor-comments-toggle',
        onSelect: onCommentsToggle,
      },
    )
    return items
  }, [onAssetLibraryOpen, onCommentsToggle, onLinterToggle, t])

  return (
    <div className="creation-editor-toolbar__actions" data-testid="editor-topbar-actions">
      <EditorToolbarMenu
        label={t('editor.menuReview')}
        icon={<IconScanSearch />}
        items={reviewItems}
        testId="editor-topbar-menu-review"
        active={linterOpen || commentsOpen}
      />
      {onBreakpointCompareToggle ? (
        <ChromeTip tip={t('editor.breakpointCompareTip')}>
          <Button
            type="button"
            size="sm"
            variant={breakpointCompareMode ? 'subtle' : 'ghost'}
            icon={<IconColumns />}
            aria-label={t('editor.breakpointCompare')}
            aria-pressed={breakpointCompareMode}
            data-testid="editor-breakpoint-compare"
            onClick={onBreakpointCompareToggle}
          />
        </ChromeTip>
      ) : null}
    </div>
  )
}

export function EditorToolbarZoom({
  t,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitCanvas,
}: Pick<EditorToolbarProps, 't' | 'zoom' | 'onZoomIn' | 'onZoomOut' | 'onFitCanvas'>) {
  return (
    <div className="creation-editor-toolbar__zoom-cluster" data-testid="editor-topbar-zoom">
      <ChromeTip tip={t('editor.zoomOutShortcut')}>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          icon={<IconZoomOut />}
          data-testid="editor-zoom-out"
          onClick={onZoomOut}
        />
      </ChromeTip>
      <Text role="meta" as="span" className="creation-editor-toolbar__zoom">
        {Math.round(zoom * 100)}%
      </Text>
      <ChromeTip tip={t('editor.zoomInShortcut')}>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          icon={<IconZoomIn />}
          data-testid="editor-zoom-in"
          onClick={onZoomIn}
        />
      </ChromeTip>
      <ChromeTip tip={t('editor.fitAllFramesShortcut')}>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          icon={<IconMaximize />}
          data-testid="editor-fit-view"
          onClick={onFitCanvas}
        />
      </ChromeTip>
    </div>
  )
}

export function EditorTopbarChrome(props: EditorToolbarProps) {
  const { t } = props
  return (
    <div
      className="creation-editor-topbar-chrome"
      data-testid="editor-topbar-chrome"
      role="toolbar"
      aria-label={t('editor.toolbar')}
    >
      {/* Inner row: tools | centered zoom | review. Outer keeps overflow:visible for elevation. */}
      <div className="creation-editor-topbar-chrome__row">
        <EditorToolbarTools {...props} />
        <EditorToolbarZoom {...props} />
        <EditorToolbarActions {...props} />
      </div>
    </div>
  )
}

export function EditorFallbackToolbar(props: EditorToolbarProps) {
  const { t } = props
  return (
    <div className="creation-editor-toolbar" role="toolbar" aria-label={t('editor.toolbar')}>
      <EditorBrandMark />
      <EditorToolbarTools {...props} />
      <EditorToolbarZoom {...props} />
      <EditorToolbarActions {...props} />
    </div>
  )
}
