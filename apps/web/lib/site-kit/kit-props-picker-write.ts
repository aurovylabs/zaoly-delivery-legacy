/**
 * Resolve Kit Props TokenPicker picks that are HUD literal presets (SK-V17).
 */
import { parseGoogleFontLiteralPath } from '../fonts/google-fonts'
import {
  isHudFontSizeLiteralPath,
  parseHudFontSizeLiteralPath,
} from '../inspect/hud-font-size-presets'
import {
  isHudFontWeightLiteralPath,
  parseHudFontWeightLiteralPath,
} from '../inspect/hud-font-weight-presets'
import {
  isHudLengthLiteralPath,
  parseHudLengthLiteralPath,
} from '../inspect/hud-length-presets'

export type KitPropsPickerWrite =
  | { kind: 'token'; path: string }
  | { kind: 'literal'; value: string }

/** Map a TokenPicker `onChange` path to token bind vs free literal. */
export function resolveKitPropsPickerPath(path: string): KitPropsPickerWrite {
  const trimmed = path.trim()
  if (isHudFontSizeLiteralPath(trimmed)) {
    return { kind: 'literal', value: parseHudFontSizeLiteralPath(trimmed) ?? trimmed }
  }
  if (isHudFontWeightLiteralPath(trimmed)) {
    return { kind: 'literal', value: parseHudFontWeightLiteralPath(trimmed) ?? trimmed }
  }
  if (isHudLengthLiteralPath(trimmed)) {
    return { kind: 'literal', value: parseHudLengthLiteralPath(trimmed) ?? trimmed }
  }
  const google = parseGoogleFontLiteralPath(trimmed)
  if (google) return { kind: 'literal', value: google }
  return { kind: 'token', path: trimmed }
}
