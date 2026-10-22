import type { CompositionScene, PrintPresetId } from '@zaoly/contracts'
import { withPrunedComments } from '../../lib/scene-comments'
import { sceneSaveFingerprint } from '../../lib/scene/scene-save-fingerprint'
import { sceneDocumentFingerprint as sceneDocumentFingerprintFromLib } from '../../lib/scene/scene-document-fingerprint'
import { activePageRoot } from '../../lib/scene/scene-pages'
import {
  resolvePrintPreset,
  resolveDigitalEditorBreakpoint,
  type EditorBreakpoint,
} from '../../lib/scene/breakpoints'
import { createHistory } from '../../lib/scene/history'
import { seedEditorPrefillMasters } from '../../lib/scene/editor-master-prefill'
import type { Bounds } from '../../lib/scene/selection'
import type { ResizeHandle } from '../../lib/scene/resize'
import {
  isTextLeafNodeType,
  preferTighterTextBounds,
  unionClientRectsToBounds,
} from '../../lib/scene/text-ink-bounds'
import { resolveMediaPaintElement } from '../../lib/editor/media-node-host-style'

export type ResizeSession = {
  handle: ResizeHandle
  startX: number
  startY: number
  layoutW: number
  layoutH: number
  currentW: number
  currentH: number
  bounds: Bounds
  pointerId: number
}

export type MarqueeSession = {
  startX: number
  startY: number
  currentX: number
  currentY: number
  pointerId: number
}

export type FrameDragSession = {
  pageId: string
  pointerId: number
  startClientX: number
  startClientY: number
  originX: number
  originY: number
}

export type LeftTab = 'components' | 'layers' | 'tokens'

export const LEFT_TAB_KEY = 'creation-editor-left-tab'

export function initialSelection(scene: CompositionScene): string[] {
  const root = activePageRoot(scene)
  const title = root.children?.find((c) => c.type === 'Text' || c.type === 'SiteText')
  return [title?.id ?? root.id]
}

function collectTextClientRects(root: HTMLElement): DOMRect[] {
  const out: DOMRect[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let current: Node | null = walker.nextNode()
  while (current) {
    if (current.textContent && current.textContent.trim()) {
      const range = document.createRange()
      range.selectNodeContents(current)
      // jsdom Range lacks getClientRects — skip ink hug in that environment.
      const rects =
        typeof range.getClientRects === 'function' ? range.getClientRects() : []
      out.push(...Array.from(rects))
    }
    current = walker.nextNode()
  }
  return out
}

export function measureNodeBounds(viewport: HTMLElement, nodeId: string): Bounds | null {
  const node = viewport.querySelector(`[data-node-id="${CSS.escape(nodeId)}"]`)
  if (!(node instanceof HTMLElement)) return null
  const vr = viewport.getBoundingClientRect()
  // Media: measure paint border box so child margin stays outside the blue selection.
  const target = resolveMediaPaintElement(node) ?? node
  const nr = target.getBoundingClientRect()
  const layout: Bounds = {
    left: nr.left - vr.left,
    top: nr.top - vr.top,
    width: Math.max(0, nr.width),
    height: Math.max(0, nr.height),
  }
  const type = node.getAttribute('data-node-type')
  if (!isTextLeafNodeType(type)) return layout
  const ink = unionClientRectsToBounds(collectTextClientRects(node), vr)
  return preferTighterTextBounds(layout, ink)
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return target.isContentEditable
}

export { sceneSaveFingerprint } from '../../lib/scene/scene-save-fingerprint'

export function sceneDocumentFingerprint(scene: CompositionScene): string {
  return sceneDocumentFingerprintFromLib(scene)
}

export function readLeftTab(): LeftTab {
  if (typeof window === 'undefined') return 'components'
  try {
    const v = sessionStorage.getItem(LEFT_TAB_KEY)
    if (v === 'layers' || v === 'tokens' || v === 'components') return v
    if (v === 'palette' || v === 'masters') return 'components'
  } catch {
    /* ignore */
  }
  return 'components'
}

export function createEditorBoot(initialScene: CompositionScene) {
  const seeded = seedEditorPrefillMasters(initialScene)
  const activeBreakpoint = resolveDigitalEditorBreakpoint(initialScene.activeBreakpoint)
  const activePrintPreset = resolvePrintPreset(initialScene.activePrintPreset)
  return {
    history: createHistory(seeded),
    savedFingerprint: sceneSaveFingerprint(seeded, activeBreakpoint, activePrintPreset),
    savedUpdatedAt: seeded.updatedAt,
    activeBreakpoint,
    activePrintPreset,
    selectedIds: initialSelection(initialScene),
  }
}
