import type { SceneNode } from '@zaoly/contracts'
import type { InspectTokenOption } from '../inspect/token-catalog'
import { previewForBinding } from '../inspect/token-catalog'
import type { EditorBreakpoint } from '../scene/breakpoints'
import { googleFontFamilyName } from './google-fonts'

function walk(node: SceneNode, visit: (n: SceneNode) => void) {
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

type CollectSceneFontFamiliesOptions = {
  /** When set, only fonts effective at this breakpoint lane are collected (P94). */
  paintBreakpoint?: EditorBreakpoint
}

function addFontFamilyLiteral(
  out: Set<string>,
  literal: string | undefined,
) {
  if (typeof literal !== 'string' || !literal.trim()) return
  const name = googleFontFamilyName(literal)
  if (name) out.add(name)
}

function addFontFamilyBinding(
  out: Set<string>,
  path: string | undefined,
  byPath: Map<string, InspectTokenOption>,
) {
  if (!path) return
  const tok = byPath.get(path)
  if (!tok) return
  const css = previewForBinding(tok, 'fontFamily')
  if (!css) return
  const name = googleFontFamilyName(css)
  if (name) out.add(name)
}

function collectFontsForNode(
  node: SceneNode,
  byPath: Map<string, InspectTokenOption>,
  paintBreakpoint: EditorBreakpoint | undefined,
  out: Set<string>,
) {
  if (paintBreakpoint) {
    const lane = node.breakpoints?.[paintBreakpoint]
    if (lane?.props?.fontFamily !== undefined || lane?.tokenBindings?.fontFamily) {
      addFontFamilyLiteral(out, lane.props?.fontFamily as string | undefined)
      addFontFamilyBinding(out, lane.tokenBindings?.fontFamily, byPath)
      return
    }
  }

  addFontFamilyLiteral(out, node.props?.fontFamily as string | undefined)
  addFontFamilyBinding(out, node.tokenBindings?.fontFamily, byPath)

  if (!paintBreakpoint && node.breakpoints) {
    for (const bp of Object.values(node.breakpoints)) {
      addFontFamilyLiteral(out, bp?.props?.fontFamily as string | undefined)
      addFontFamilyBinding(out, bp?.tokenBindings?.fontFamily, byPath)
    }
  }
}

/**
 * Collect CSS font-family names used by the scene (literals + resolved token bindings).
 */
export function collectSceneFontFamilies(
  root: SceneNode,
  catalog: InspectTokenOption[],
  options?: CollectSceneFontFamiliesOptions,
): string[] {
  const byPath = new Map(catalog.map((t) => [t.path, t]))
  const out = new Set<string>()
  const paintBreakpoint = options?.paintBreakpoint

  walk(root, (node) => {
    collectFontsForNode(node, byPath, paintBreakpoint, out)
  })

  return [...out]
}
