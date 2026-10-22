/** Preview viewport ids — shared by HTML export and Playwright screenshot path. */

import { EDITOR_BREAKPOINT_WIDTHS } from './breakpoints'

export type ScenePreviewBreakpoint = 'mobile' | 'tablet' | 'desktop'

export const SCENE_PREVIEW_VIEWPORTS: Record<
  ScenePreviewBreakpoint,
  { width: number; height: number }
> = {
  mobile: { width: EDITOR_BREAKPOINT_WIDTHS.mobile, height: 700 },
  tablet: { width: EDITOR_BREAKPOINT_WIDTHS.tablet, height: 720 },
  desktop: { width: EDITOR_BREAKPOINT_WIDTHS.desktop, height: 900 },
}

export function normalizePreviewBreakpoint(raw: unknown): ScenePreviewBreakpoint {
  if (raw === 'mobile' || raw === 'tablet' || raw === 'desktop') return raw
  return 'desktop'
}
