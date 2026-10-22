import type { InspectFieldDef } from './field-catalog'

/** Effect chrome kept in Appearance (not radius / opacity). */
export const APPEARANCE_EFFECT_KEYS = [
  'shadow', 'blur', 'overflow', 'mixBlendMode', 'filterBrightness',
  'filterContrast', 'filterSaturate', 'filterGrayscale', 'filterInvert', 'filterHueRotate',
] as const

export const APPEARANCE_EFFECT_NAMES = new Set<string>(APPEARANCE_EFFECT_KEYS)

export function compactEffectLabel(name: string): string {
  const map: Record<string, string> = {
    shadow: 'Shadow',
    blur: 'Blur',
    overflow: 'Overflow',
    mixBlendMode: 'Blend',
    filterBrightness: 'Brightness',
    filterContrast: 'Contrast',
    filterSaturate: 'Saturate',
    filterGrayscale: 'Grayscale',
    filterInvert: 'Invert',
    filterHueRotate: 'Hue Rotate',
  }
  return map[name] ?? name
}

export function isAppearanceEffectField(name: string): boolean {
  return APPEARANCE_EFFECT_NAMES.has(name)
}

export function partitionInspectAppearanceEffectFields(fields: InspectFieldDef[]): {
  effects: InspectFieldDef[]
  rest: InspectFieldDef[]
} {
  const effects: InspectFieldDef[] = []
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if (isAppearanceEffectField(field.name)) effects.push(field)
    else rest.push(field)
  }
  return { effects, rest }
}
