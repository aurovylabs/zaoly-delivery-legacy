'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Button, Dialog, Field, Input, Text, ToggleGroup } from '@zaoly/ui'
import {
  PAGE_CREATE_PRESETS,
  buildAddPageOp,
  pageCreatePresetsFromPack,
  type PageCreatePresetId,
  type PageCreateSizeMode,
} from '../lib/scene/page-create-presets'
import type { ZaolyPackLeaf } from '../lib/inspect/token-catalog'
import type { SceneOp } from '@zaoly/contracts'

export type EditorAddPageDialogProps = {
  open: boolean
  onClose: () => void
  t: (key: string, params?: Record<string, string>) => string
  onCreate: (op: SceneOp) => void
  /** Sync cascade when the create op chose a digital breakpoint. */
  onBreakpointSync?: (breakpoint: string) => void
  /** Merged local pack leaves (artboard.preset.*). */
  packLeaves?: readonly ZaolyPackLeaf[] | null
}

export function EditorAddPageDialog({
  open,
  onClose,
  t,
  onCreate,
  onBreakpointSync,
  packLeaves,
}: EditorAddPageDialogProps) {
  const presets = useMemo(() => pageCreatePresetsFromPack(packLeaves), [packLeaves])
  const defaultPresetId = presets[0]?.id ?? 'desktop'
  const [name, setName] = useState('')
  const [mode, setMode] = useState<PageCreateSizeMode>('preset')
  const [presetId, setPresetId] = useState<PageCreatePresetId>(defaultPresetId)
  const [customWidth, setCustomWidth] = useState(String(presets[0]?.width ?? 1440))
  const [customHeight, setCustomHeight] = useState(String(presets[0]?.height ?? 900))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const first = presets[0] ?? PAGE_CREATE_PRESETS[0]!
    setName('')
    setMode('preset')
    setPresetId(first.id)
    setCustomWidth(String(first.width))
    setCustomHeight(String(first.height))
    setError(null)
  }, [open, presets])

  function applyPresetToCustomFields(id: PageCreatePresetId) {
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    setCustomWidth(String(preset.width))
    setCustomHeight(String(preset.height))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const built = buildAddPageOp(
      {
        name,
        mode,
        presetId,
        customWidth: Number(customWidth),
        customHeight: Number(customHeight),
      },
      presets,
    )
    if ('error' in built) {
      setError(t('editor.pageCreateCustomDimsError'))
      return
    }
    onCreate(built)
    if (built.op === 'add_page' && built.breakpoint) {
      onBreakpointSync?.(built.breakpoint)
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('editor.pageCreateTitle')}
      data-testid="editor-add-page-dialog"
      actions={
        <>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            {t('editor.pageCreateCancel')}
          </Button>
          <Button
            type="submit"
            form="editor-add-page-form"
            size="sm"
            variant="primary"
            data-testid="editor-add-page-confirm"
          >
            {t('editor.pageCreateConfirm')}
          </Button>
        </>
      }
    >
      <form
        id="editor-add-page-form"
        onSubmit={handleSubmit}
        style={{ display: 'grid', gap: '0.85rem' }}
      >
        <Field label={t('editor.pageCreateName')} size="sm">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('editor.pageCreateNamePlaceholder')}
            block
            data-testid="editor-add-page-name"
          />
        </Field>

        <div>
          <Text role="meta" as="p" style={{ marginBottom: '0.35rem' }}>
            {t('editor.pageCreateSize')}
          </Text>
          <div data-testid="editor-add-page-size-mode">
            <ToggleGroup
              aria-label={t('editor.pageCreateSize')}
              value={mode}
              onChange={(v) => setMode(v === 'custom' ? 'custom' : 'preset')}
              options={[
                { value: 'preset', label: t('editor.pageCreateModePreset') },
                { value: 'custom', label: t('editor.pageCreateModeCustom') },
              ]}
            />
          </div>
        </div>

        {mode === 'preset' ? (
          <div
            role="radiogroup"
            aria-label={t('editor.pageCreatePresets')}
            data-testid="editor-add-page-presets"
            style={{ display: 'grid', gap: '0.4rem' }}
          >
            {presets.map((preset) => {
              const selected = presetId === preset.id
              const label =
                preset.labelKey != null ? t(preset.labelKey) : preset.label
              return (
                <button
                  key={preset.path}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-testid={`editor-add-page-preset-${preset.id}`}
                  onClick={() => {
                    setPresetId(preset.id)
                    applyPresetToCustomFields(preset.id)
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    textAlign: 'left',
                    padding: '0.55rem 0.7rem',
                    borderRadius: '6px',
                    border: selected
                      ? '1px solid var(--zaoly-accent, #8bc34a)'
                      : '1px solid var(--zaoly-border, #333)',
                    background: selected
                      ? 'color-mix(in srgb, var(--zaoly-accent, #8bc34a) 12%, transparent)'
                      : 'transparent',
                    cursor: 'pointer',
                    color: 'inherit',
                    font: 'inherit',
                  }}
                >
                  <span>{label}</span>
                  <Text role="meta" as="span">
                    {preset.width} × {preset.height}
                  </Text>
                </button>
              )
            })}
          </div>
        ) : (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}
            data-testid="editor-add-page-custom-dims"
          >
            <Field label={t('editor.pageCreateWidth')} size="sm">
              <Input
                type="number"
                min={1}
                step={1}
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                block
                required
                data-testid="editor-add-page-width"
              />
            </Field>
            <Field label={t('editor.pageCreateHeight')} size="sm">
              <Input
                type="number"
                min={1}
                step={1}
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                block
                required
                data-testid="editor-add-page-height"
              />
            </Field>
          </div>
        )}

        {error ? (
          <p role="alert" style={{ color: 'var(--zaoly-danger, #c00)', margin: 0 }}>
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}
