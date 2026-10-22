/**
 * Kit Props pane — which style keys can bind token pack leaves (SK-V16+).
 * Binding keys match `resolveNodePaintStyle` / BINDING_TO_CSS (background → backgroundColor).
 */
import type { TokenPreviewKind } from '@zaoly/ui'
import type { TokenGroupId } from '../inspect/token-catalog'

export type KitPropsTokenSlot = {
  /** CSS style key shown in the Props list (e.g. backgroundColor). */
  styleKey: string
  /** Composition `tokenBindings` key (e.g. background). */
  bindingKey: string
  group: Extract<TokenGroupId, 'color' | 'fontFamily' | 'fontSize' | 'fontWeight' | 'space' | 'radius'>
  previewKind: TokenPreviewKind
}

/** Selectable style → binding map for Kit Props TokenPicker rows. */
export const KIT_PROPS_TOKEN_SLOTS: Readonly<Record<string, KitPropsTokenSlot>> = {
  color: {
    styleKey: 'color',
    bindingKey: 'color',
    group: 'color',
    previewKind: 'color',
  },
  backgroundColor: {
    styleKey: 'backgroundColor',
    bindingKey: 'background',
    group: 'color',
    previewKind: 'color',
  },
  background: {
    styleKey: 'background',
    bindingKey: 'background',
    group: 'color',
    previewKind: 'color',
  },
  borderColor: {
    styleKey: 'borderColor',
    bindingKey: 'borderColor',
    group: 'color',
    previewKind: 'color',
  },
  fontFamily: {
    styleKey: 'fontFamily',
    bindingKey: 'fontFamily',
    group: 'fontFamily',
    previewKind: 'type',
  },
  fontSize: {
    styleKey: 'fontSize',
    bindingKey: 'fontSize',
    group: 'fontSize',
    previewKind: 'type',
  },
  fontWeight: {
    styleKey: 'fontWeight',
    bindingKey: 'fontWeight',
    group: 'fontWeight',
    previewKind: 'type',
  },
  borderRadius: {
    styleKey: 'borderRadius',
    bindingKey: 'radius',
    group: 'radius',
    previewKind: 'radius',
  },
  padding: {
    styleKey: 'padding',
    bindingKey: 'padding',
    group: 'space',
    previewKind: 'space',
  },
  gap: {
    styleKey: 'gap',
    bindingKey: 'gap',
    group: 'space',
    previewKind: 'space',
  },
}

/** Inverse: binding key → preferred style key for UI. */
const BINDING_TO_STYLE_KEY: Record<string, string> = {
  color: 'color',
  background: 'backgroundColor',
  borderColor: 'borderColor',
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  radius: 'borderRadius',
  padding: 'padding',
  gap: 'gap',
}

export function kitPropsTokenSlotForStyleKey(styleKey: string): KitPropsTokenSlot | null {
  return KIT_PROPS_TOKEN_SLOTS[styleKey] ?? null
}

export function kitPropsTokenSlotForBindingKey(bindingKey: string): KitPropsTokenSlot | null {
  const styleKey = BINDING_TO_STYLE_KEY[bindingKey]
  if (!styleKey) return null
  return KIT_PROPS_TOKEN_SLOTS[styleKey] ?? null
}

/**
 * Union of bindable slots from root style + tokenBindings (deduped by bindingKey).
 */
export function collectKitPropsTokenSlots(
  style: Record<string, string | number> | undefined,
  tokenBindings: Record<string, string> | undefined,
  extraBindingKeys: readonly string[] = [],
): KitPropsTokenSlot[] {
  const byBinding = new Map<string, KitPropsTokenSlot>()
  for (const key of Object.keys(style ?? {})) {
    const slot = kitPropsTokenSlotForStyleKey(key)
    if (slot) byBinding.set(slot.bindingKey, slot)
  }
  for (const key of Object.keys(tokenBindings ?? {})) {
    const slot = kitPropsTokenSlotForBindingKey(key)
    if (slot) byBinding.set(slot.bindingKey, slot)
  }
  for (const key of extraBindingKeys) {
    const slot = kitPropsTokenSlotForBindingKey(key)
    if (slot) byBinding.set(slot.bindingKey, slot)
  }
  return [...byBinding.values()].sort((a, b) => a.styleKey.localeCompare(b.styleKey))
}

/** Canonical slots for Add binding (one per bindingKey; prefer backgroundColor over background). */
export const KIT_PROPS_ADDABLE_SLOTS: readonly KitPropsTokenSlot[] = [
  KIT_PROPS_TOKEN_SLOTS.color!,
  KIT_PROPS_TOKEN_SLOTS.backgroundColor!,
  KIT_PROPS_TOKEN_SLOTS.borderColor!,
  KIT_PROPS_TOKEN_SLOTS.fontFamily!,
  KIT_PROPS_TOKEN_SLOTS.fontSize!,
  KIT_PROPS_TOKEN_SLOTS.fontWeight!,
  KIT_PROPS_TOKEN_SLOTS.borderRadius!,
  KIT_PROPS_TOKEN_SLOTS.padding!,
  KIT_PROPS_TOKEN_SLOTS.gap!,
]

export function missingKitPropsTokenSlots(
  present: readonly KitPropsTokenSlot[],
): KitPropsTokenSlot[] {
  const have = new Set(present.map((s) => s.bindingKey))
  return KIT_PROPS_ADDABLE_SLOTS.filter((s) => !have.has(s.bindingKey))
}
