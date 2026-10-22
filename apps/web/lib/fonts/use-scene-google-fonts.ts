'use client'

import { useEffect } from 'react'
import type { SceneNode } from '@zaoly/contracts'
import type { InspectTokenOption } from '../inspect/token-catalog'
import type { EditorBreakpoint } from '../scene/breakpoints'
import { collectSceneFontFamilies } from './collect-scene-font-families'
import { ensureGoogleFontStylesheets } from './google-fonts'

/** Loads Google Fonts CSS2 for families referenced by the live scene (active page + breakpoint). */
export function useSceneGoogleFonts(
  root: SceneNode,
  catalog: InspectTokenOption[],
  paintBreakpoint?: EditorBreakpoint,
) {
  useEffect(() => {
    const families = collectSceneFontFamilies(root, catalog, { paintBreakpoint })
    if (families.length) ensureGoogleFontStylesheets(families)
  }, [root, catalog, paintBreakpoint])
}
