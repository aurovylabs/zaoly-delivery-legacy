import {
  formatDigitalLengthFromStagePx,
  formatPrintLengthFromStagePx,
  gridPreviewPctForChannel,
  GRID_EDITOR_REFERENCE_MM,
  GRID_EDITOR_REFERENCE_PX,
  preferredDigitalUnit,
  stagePxFromPct,
  type GridEditorChannel,
} from './grid-editor'

export type BreakpointEditorChannel = GridEditorChannel

export type BreakpointPreset = {
  id: string
  label: string
  value: string
}

export const DEFAULT_DIGITAL_BREAKPOINT_PRESETS: BreakpointPreset[] = [
  { id: 'sm', label: 'SM', value: '480px' },
  { id: 'md', label: 'MD', value: '768px' },
  { id: 'lg', label: 'LG', value: '1024px' },
  { id: 'xl', label: 'XL', value: '1280px' },
]

export const DEFAULT_PRINT_BREAKPOINT_PRESETS: BreakpointPreset[] = [
  { id: 'a5', label: 'A5', value: '148mm' },
  { id: 'a4', label: 'A4', value: '210mm' },
]

export function breakpointPresetsForChannel(
  channel: BreakpointEditorChannel,
): BreakpointPreset[] {
  return channel === 'print'
    ? DEFAULT_PRINT_BREAKPOINT_PRESETS
    : DEFAULT_DIGITAL_BREAKPOINT_PRESETS
}

export function breakpointDevicePct(
  minWidth: string | undefined,
  channel: BreakpointEditorChannel,
  referencePx = GRID_EDITOR_REFERENCE_PX,
  referenceMm = GRID_EDITOR_REFERENCE_MM,
): string {
  return (
    gridPreviewPctForChannel(minWidth, channel, referencePx, referenceMm) || '40%'
  )
}

export function formatMinWidthFromStagePx(
  px: number,
  stageWidth: number,
  channel: BreakpointEditorChannel,
  preferUnit: 'rem' | 'px',
  referenceMm = GRID_EDITOR_REFERENCE_MM,
): string {
  if (channel === 'print') {
    return formatPrintLengthFromStagePx(px, stageWidth, referenceMm)
  }
  return formatDigitalLengthFromStagePx(px, preferUnit)
}

export function minWidthPxFromPct(
  pct: number,
  stageWidth: number,
): number {
  return stagePxFromPct(pct, stageWidth)
}

export { preferredDigitalUnit, GRID_EDITOR_REFERENCE_PX, GRID_EDITOR_REFERENCE_MM }
