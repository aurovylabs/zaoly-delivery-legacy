'use client'

import { useMemo, useState } from 'react'
import { Button, Text } from '@zaoly/ui'
import type { SiteKitCompositionNode } from '@zaoly/site-kit'
import type { Translator } from '../../lib/i18n'
import type { InspectTokenOption } from '../../lib/inspect/token-catalog'
import {
  formatCompositionPath,
  listCompositionOutline,
  pathsEqual,
  type CompositionPath,
} from '../../lib/site-kit/composition-path'
import {
  collectKitPropsTokenSlots,
  kitPropsTokenSlotForStyleKey,
  missingKitPropsTokenSlots,
  type KitPropsTokenSlot,
} from '../../lib/site-kit/kit-props-token-slots'
import { findSiteKitEntry } from '../../lib/site-kit/site-kit-catalog'
import { KitPropsTokenField } from './kit-props-token-field'
import { KitAtomSourcePanel } from './kit-atom-source-panel'

function editablePropEntries(
  props: Record<string, unknown> | undefined,
): { key: string; value: string | number | boolean; kind: 'string' | 'number' | 'boolean' }[] {
  if (!props) return []
  const out: { key: string; value: string | number | boolean; kind: 'string' | 'number' | 'boolean' }[] =
    []
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' && typeof value !== 'string' && typeof value !== 'number') continue
    if (typeof value === 'string') out.push({ key, value, kind: 'string' })
    else if (typeof value === 'number') out.push({ key, value, kind: 'number' })
    else if (typeof value === 'boolean') out.push({ key, value, kind: 'boolean' })
  }
  return out
}

function editableStyleEntries(
  style: Record<string, string | number> | undefined,
  tokenStyleKeys: ReadonlySet<string>,
): { key: string; value: string | number; kind: 'string' | 'number' }[] {
  if (!style) return []
  const out: { key: string; value: string | number; kind: 'string' | 'number' }[] = []
  for (const [key, value] of Object.entries(style)) {
    if (tokenStyleKeys.has(key)) continue
    if (kitPropsTokenSlotForStyleKey(key)) continue
    if (typeof value === 'string') out.push({ key, value, kind: 'string' })
    else if (typeof value === 'number') out.push({ key, value, kind: 'number' })
  }
  return out
}

/** Ephemeral node props + selectable token style slots for Kit Playground (SK-V17). */
export function KitPlaygroundPropsPane({
  composition,
  selectedPath = [],
  onSelectPath,
  tokenCatalog = [],
  onChange,
  onStyleChange,
  onTokenBindingChange,
  onAddBinding,
  storybookOrigin = null,
  t,
}: {
  composition: SiteKitCompositionNode | null
  selectedPath?: CompositionPath
  onSelectPath?: (path: number[]) => void
  tokenCatalog?: readonly InspectTokenOption[]
  onChange: (key: string, value: string | number | boolean) => void
  onStyleChange: (key: string, value: string | number) => void
  onTokenBindingChange: (
    next:
      | { kind: 'token'; bindingKey: string; path: string }
      | { kind: 'literal'; bindingKey: string; styleKey: string; value: string }
      | { kind: 'clear'; bindingKey: string; styleKey: string },
  ) => void
  onAddBinding: (slot: KitPropsTokenSlot) => void
  storybookOrigin?: string | null
  t: Translator
}) {
  const [extraBindingKeys, setExtraBindingKeys] = useState<string[]>([])
  const outline = useMemo(() => listCompositionOutline(composition), [composition])
  const selectedNode = useMemo(() => {
    if (!composition) return null
    let node: SiteKitCompositionNode = composition
    for (const index of selectedPath) {
      const child = node.children?.[index]
      if (!child) return null
      node = child
    }
    return node
  }, [composition, selectedPath])

  const entries = editablePropEntries(selectedNode?.props)
  const tokenSlots = useMemo(
    () =>
      collectKitPropsTokenSlots(
        selectedNode?.style,
        selectedNode?.tokenBindings,
        extraBindingKeys,
      ),
    [selectedNode?.style, selectedNode?.tokenBindings, extraBindingKeys],
  )
  const missingSlots = useMemo(() => missingKitPropsTokenSlots(tokenSlots), [tokenSlots])
  const tokenStyleKeys = useMemo(
    () => new Set(tokenSlots.map((s) => s.styleKey)),
    [tokenSlots],
  )
  const styleEntries = editableStyleEntries(selectedNode?.style, tokenStyleKeys)

  if (!composition) {
    return (
      <div className="creation-kit-props" data-testid="kit-props-empty">
        <Text role="meta" as="p">
          {t('kit.propsEmpty')}
        </Text>
      </div>
    )
  }

  if (!selectedNode) {
    return (
      <div className="creation-kit-props" data-testid="kit-props-path-missing">
        <Text role="meta" as="p">
          {t('kit.propsPathMissing')}
        </Text>
        <Button type="button" size="sm" variant="ghost" onClick={() => onSelectPath?.([])}>
          {t('kit.propsSelectRoot')}
        </Button>
      </div>
    )
  }

  const emptyFields =
    entries.length === 0 && styleEntries.length === 0 && tokenSlots.length === 0

  return (
    <div className="creation-kit-props" data-testid="kit-props-pane">
      {outline.length > 1 ? (
        <div className="creation-kit-props__tree" data-testid="kit-props-tree">
          <Text role="meta" as="p" className="creation-kit-props__section">
            {t('kit.propsTree')}
          </Text>
          <ul className="creation-kit-props__tree-list">
            {outline.map((entry) => {
              const active = pathsEqual(entry.path, selectedPath)
              return (
                <li key={entry.path.join('.') || 'root'}>
                  <button
                    type="button"
                    className={
                      active
                        ? 'creation-kit-props__tree-item creation-kit-props__tree-item--active'
                        : 'creation-kit-props__tree-item'
                    }
                    style={{ paddingLeft: `${0.35 + entry.depth * 0.75}rem` }}
                    data-testid={`kit-props-tree-${entry.path.length === 0 ? 'root' : entry.path.join('.')}`}
                    aria-pressed={active}
                    onClick={() => {
                      setExtraBindingKeys([])
                      onSelectPath?.(entry.path)
                    }}
                  >
                    {entry.type}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
      <Text role="meta" as="p" className="creation-kit-playground__pane-label">
        {t('kit.propsPane')} · {selectedNode.type}
        {selectedPath.length > 0 ? (
          <span className="creation-kit-props__path-meta"> · {formatCompositionPath(selectedPath)}</span>
        ) : null}
      </Text>
      {findSiteKitEntry(selectedNode.type) ? (
        <KitAtomSourcePanel
          componentId={selectedNode.type}
          kind="atom"
          storybookOrigin={storybookOrigin}
          title={`${t('kit.propsAtomSource')} · ${selectedNode.type}`}
          testIdPrefix="kit-props-atom-source"
          t={t}
        />
      ) : null}
      {emptyFields ? (
        <Text role="meta" as="p" data-testid="kit-props-none">
          {t('kit.propsNone')}
        </Text>
      ) : null}
      {entries.length > 0 ? (
        <ul className="creation-kit-props__list" data-testid="kit-props-list">
          {entries.map((entry) => (
            <li key={entry.key} className="creation-kit-props__row">
              <label>
                <span className="creation-kit-props__key">{entry.key}</span>
                {entry.kind === 'boolean' ? (
                  <input
                    type="checkbox"
                    data-testid={`kit-prop-${entry.key}`}
                    checked={Boolean(entry.value)}
                    onChange={(e) => onChange(entry.key, e.target.checked)}
                  />
                ) : (
                  <input
                    type={entry.kind === 'number' ? 'number' : 'text'}
                    data-testid={`kit-prop-${entry.key}`}
                    value={String(entry.value)}
                    onChange={(e) => {
                      if (entry.kind === 'number') {
                        const n = Number(e.target.value)
                        onChange(entry.key, Number.isFinite(n) ? n : 0)
                      } else {
                        onChange(entry.key, e.target.value)
                      }
                    }}
                  />
                )}
              </label>
            </li>
          ))}
        </ul>
      ) : null}
      {tokenSlots.length > 0 || missingSlots.length > 0 ? (
        <div className="creation-kit-props__tokens" data-testid="kit-props-token-board">
          <div className="creation-kit-props__tokens-head">
            <Text role="meta" as="p" className="creation-kit-props__section">
              {t('kit.propsTokensPane')}
            </Text>
            {missingSlots.length > 0 ? (
              <label className="creation-kit-props__add-binding">
                <span className="creation-kit-props__add-binding-label">{t('kit.propsAddBinding')}</span>
                <select
                  data-testid="kit-props-add-binding"
                  defaultValue=""
                  onChange={(e) => {
                    const bindingKey = e.target.value
                    e.target.value = ''
                    const slot = missingSlots.find((s) => s.bindingKey === bindingKey)
                    if (!slot) return
                    setExtraBindingKeys((prev) =>
                      prev.includes(slot.bindingKey) ? prev : [...prev, slot.bindingKey],
                    )
                    onAddBinding(slot)
                  }}
                >
                  <option value="" disabled>
                    {t('kit.propsAddBindingPlaceholder')}
                  </option>
                  {missingSlots.map((slot) => (
                    <option key={slot.bindingKey} value={slot.bindingKey}>
                      {slot.styleKey}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          {tokenSlots.length > 0 ? (
            <ul className="creation-kit-props__token-list" data-testid="kit-props-token-list">
              {tokenSlots.map((slot) => {
                const boundPath = selectedNode.tokenBindings?.[slot.bindingKey]?.trim() ?? ''
                const literalRaw = selectedNode.style?.[slot.styleKey]
                const literalValue =
                  literalRaw != null && String(literalRaw).trim() ? String(literalRaw) : ''
                return (
                  <KitPropsTokenField
                    key={slot.bindingKey}
                    slot={slot}
                    boundPath={boundPath}
                    literalValue={boundPath ? '' : literalValue}
                    tokenCatalog={tokenCatalog}
                    onPickToken={(path) =>
                      onTokenBindingChange({
                        kind: 'token',
                        bindingKey: slot.bindingKey,
                        path,
                      })
                    }
                    onLiteral={(raw) =>
                      onTokenBindingChange({
                        kind: 'literal',
                        bindingKey: slot.bindingKey,
                        styleKey: slot.styleKey,
                        value: raw,
                      })
                    }
                    onClear={() =>
                      onTokenBindingChange({
                        kind: 'clear',
                        bindingKey: slot.bindingKey,
                        styleKey: slot.styleKey,
                      })
                    }
                  />
                )
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
      {styleEntries.length > 0 ? (
        <>
          <Text role="meta" as="p" className="creation-kit-props__section">
            {t('kit.stylePane')}
          </Text>
          <ul className="creation-kit-props__list" data-testid="kit-style-list">
            {styleEntries.map((entry) => (
              <li key={entry.key} className="creation-kit-props__row">
                <label>
                  <span className="creation-kit-props__key">{entry.key}</span>
                  <input
                    type={entry.kind === 'number' ? 'number' : 'text'}
                    data-testid={`kit-style-${entry.key}`}
                    value={String(entry.value)}
                    onChange={(e) => {
                      if (entry.kind === 'number') {
                        const n = Number(e.target.value)
                        onStyleChange(entry.key, Number.isFinite(n) ? n : 0)
                      } else {
                        onStyleChange(entry.key, e.target.value)
                      }
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <Text role="meta" as="p" className="creation-kit-props__hint">
        {t('kit.propsHint')}
      </Text>
    </div>
  )
}

export function KitPlaygroundCopyLink({
  href,
  t,
}: {
  href: string
  t: Translator
}) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      data-testid="kit-copy-link"
      onClick={() => {
        const full =
          typeof window !== 'undefined' ? `${window.location.origin}${href}` : href
        void navigator.clipboard?.writeText(full).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1600)
        })
      }}
    >
      {copied ? t('kit.copyLinkCopied') : t('kit.copyLink')}
    </Button>
  )
}
