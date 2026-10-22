'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CompositionScene, SceneBreakpointId, SceneOp } from '@zaoly/contracts'
import { Button, Field, Input, InspectSection, PropertyInspector, Select, Text } from '@zaoly/ui'
import type { ZaolyPackLeaf } from '../lib/inspect/token-catalog'
import { DIGITAL_EDITOR_BREAKPOINTS } from '../lib/scene/breakpoints'
import {
  pageCreatePresetsFromPack,
  planApplyArtboardPresetToPage,
  type PageCreatePreset,
} from '../lib/scene/page-create-presets'
import {
  pageIdFromBoardFrameNodeId,
  resolvePageArtboardHeight,
  resolvePageArtboardWidth,
} from '../lib/scene/scene-board'
import { useUserPrefs } from '../lib/user-prefs'
import { paths } from '../lib/paths'

type EditorPageFrameInspectorProps = {
  scene: CompositionScene
  selectedFrameNodeId: string
  sceneDefaultArtboardWidth: number
  onOp: (op: SceneOp) => void
  onOps?: (ops: SceneOp[]) => void
  packLeaves?: readonly ZaolyPackLeaf[] | null
  onBreakpointSync?: (breakpoint: string) => void
  /** When true, show Token Studio manage link for artboard presets. */
  canManagePresets?: boolean
}

export function EditorPageFrameInspector({
  scene,
  selectedFrameNodeId,
  sceneDefaultArtboardWidth,
  onOp,
  onOps,
  packLeaves,
  onBreakpointSync,
  canManagePresets = false,
}: EditorPageFrameInspectorProps) {
  const { t } = useUserPrefs()
  const pageId = pageIdFromBoardFrameNodeId(selectedFrameNodeId)
  const page = scene.pages?.find((p) => p.id === pageId)
  const pageCount = scene.pages?.length ?? 0
  const canDelete = pageCount > 1
  const sceneBp = scene.activeBreakpoint ?? 'desktop'
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const presets = useMemo(() => pageCreatePresetsFromPack(packLeaves), [packLeaves])

  useEffect(() => {
    setNameDraft(null)
  }, [pageId])

  const breakpointOptions = useMemo(
    () => [
      {
        value: '__scene__',
        label: t('editor.pageFrame.breakpointScene', {
          bp: t(`editor.breakpoint.${sceneBp}`),
        }),
      },
      ...DIGITAL_EDITOR_BREAKPOINTS.map((bp) => ({
        value: bp,
        label: t(`editor.breakpoint.${bp}`),
      })),
    ],
    [sceneBp, t],
  )

  if (!pageId || !page) {
    return (
      <PropertyInspector title={t('editor.inspector')} data-testid="creation-editor-inspector">
        <Text role="meta" as="p">
          {t('editor.selectHint')}
        </Text>
      </PropertyInspector>
    )
  }

  const editPageId = page.id
  const pageName = page.name
  const frame = page.frame ?? { x: 0, y: 0 }
  const derivedWidth = resolvePageArtboardWidth(page, scene)
  const derivedHeight = resolvePageArtboardHeight(page, scene, 640)
  const widthOverride =
    typeof page.frame?.width === 'number' && page.frame.width > 0
      ? String(page.frame.width)
      : ''
  const heightOverride =
    typeof page.frame?.height === 'number' && page.frame.height > 0
      ? String(page.frame.height)
      : ''
  const nameValue = nameDraft ?? pageName

  function writeFrame(patch: {
    x?: number
    y?: number
    width?: number
    height?: number
    clearWidth?: boolean
    clearHeight?: boolean
  }) {
    onOp({ op: 'set_page_frame', pageId: editPageId, ...patch })
  }

  function writeBreakpoint(value: string) {
    if (value === '__scene__') {
      onOp({ op: 'set_page_breakpoint', pageId: editPageId, breakpoint: null })
      return
    }
    onOp({
      op: 'set_page_breakpoint',
      pageId: editPageId,
      breakpoint: value as SceneBreakpointId,
    })
  }

  function applyPreset(preset: PageCreatePreset) {
    const ops = planApplyArtboardPresetToPage(editPageId, preset)
    if (onOps) onOps(ops)
    else for (const op of ops) onOp(op)
    if (preset.breakpoint) onBreakpointSync?.(preset.breakpoint)
  }

  function matchingPresetId(): string | null {
    if (!page) return null
    for (const preset of presets) {
      const widthMatch = page.frame?.width === preset.width
      const heightMatch = page.frame?.height === preset.height
      const laneMatch =
        !preset.breakpoint || page.breakpoint === preset.breakpoint
      if (widthMatch && heightMatch && laneMatch) return preset.id
    }
    return null
  }

  const activePresetId = matchingPresetId()

  function commitName() {
    const next = nameValue.trim()
    setNameDraft(null)
    if (next && next !== pageName) {
      onOp({ op: 'rename_page', pageId: editPageId, name: next })
    }
  }

  return (
    <PropertyInspector title={t('editor.inspector')} data-testid="creation-editor-inspector">
      <InspectSection title={t('editor.pageFrame.section')} titleId="creation-inspect-page-frame">
        <Field label={t('editor.pageFrame.name')}>
          <Input
            value={nameValue}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            data-testid="editor-page-frame-name"
          />
        </Field>
        <div data-testid="editor-page-frame-presets">
          <Text role="meta" as="p" style={{ marginBottom: '0.35rem' }}>
            {t('editor.pageFrame.presets')}
          </Text>
          <div
            role="group"
            aria-label={t('editor.pageFrame.presets')}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}
          >
            {presets.map((preset) => {
              const selected = activePresetId === preset.id
              return (
                <Button
                  key={preset.path}
                  type="button"
                  size="sm"
                  variant={selected ? 'subtle' : 'ghost'}
                  aria-pressed={selected}
                  data-testid={`editor-page-frame-preset-${preset.id}`}
                  title={`${preset.width} × ${preset.height}`}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </Button>
              )
            })}
          </div>
          {canManagePresets ? (
            <Text role="meta" as="p" style={{ marginTop: '0.35rem' }}>
              <a href={paths.routes.tokensFocus('artboard.preset.desktop')}>
                {t('editor.pageFrame.presetsManage')}
              </a>
            </Text>
          ) : null}
        </div>
        <Field label={t('editor.pageFrame.posX')}>
          <Input
            type="number"
            value={String(frame.x)}
            onChange={(e) => {
              const x = Number(e.target.value)
              if (Number.isFinite(x)) writeFrame({ x })
            }}
            data-testid="editor-page-frame-x"
          />
        </Field>
        <Field label={t('editor.pageFrame.posY')}>
          <Input
            type="number"
            value={String(frame.y)}
            onChange={(e) => {
              const y = Number(e.target.value)
              if (Number.isFinite(y)) writeFrame({ y })
            }}
            data-testid="editor-page-frame-y"
          />
        </Field>
        <Field label={t('editor.pageFrame.width')}>
          <Input
            type="number"
            placeholder={String(derivedWidth)}
            value={widthOverride}
            onChange={(e) => {
              const raw = e.target.value.trim()
              if (!raw) {
                writeFrame({ clearWidth: true })
                return
              }
              const width = Number(raw)
              if (Number.isFinite(width) && width > 0) writeFrame({ width })
            }}
            data-testid="editor-page-frame-width"
          />
        </Field>
        <Field label={t('editor.pageFrame.height')}>
          <Input
            type="number"
            placeholder={String(derivedHeight)}
            value={heightOverride}
            onChange={(e) => {
              const raw = e.target.value.trim()
              if (!raw) {
                writeFrame({ clearHeight: true })
                return
              }
              const height = Number(raw)
              if (Number.isFinite(height) && height > 0) writeFrame({ height })
            }}
            data-testid="editor-page-frame-height"
          />
        </Field>
        <Field label={t('editor.pageFrame.breakpoint')}>
          <Select
            value={page.breakpoint ?? '__scene__'}
            onChange={writeBreakpoint}
            options={breakpointOptions}
            data-testid="editor-page-frame-breakpoint"
          />
        </Field>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canDelete}
          title={canDelete ? t('editor.pageFrame.delete') : t('editor.pageFrame.deleteDisabled')}
          data-testid="editor-page-frame-delete"
          onClick={() => {
            if (canDelete) onOp({ op: 'delete_page', pageId: editPageId })
          }}
        >
          {t('editor.pageFrame.delete')}
        </Button>
        <Text role="meta" as="p" className="creation-editor-page-frame-meta">
          {t('editor.pageFrame.derivedSize', { width: derivedWidth, height: derivedHeight })}
          {sceneDefaultArtboardWidth !== derivedWidth
            ? ` · ${t('editor.pageFrame.sceneWidth', { width: sceneDefaultArtboardWidth })}`
            : ''}
        </Text>
      </InspectSection>
    </PropertyInspector>
  )
}
