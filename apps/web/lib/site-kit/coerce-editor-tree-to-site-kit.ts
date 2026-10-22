/**
 * Coerce editor chrome layout/atoms to Site Kit catalog types for Pattern save.
 * Spec: page-as-pattern.md · site-kit-atoms-first.md · site-svg.md
 *
 * Editor wrap still inserts `Stack`/`Grid`; Site Kit validate rejects those.
 * SiteSvg keeps inspect-only `mark` in the scene — strip/resolve before save.
 */
import type { SceneNode } from '@zaoly/contracts'
import { siteSvgMark } from '@zaoly/site-kit'
import { isInstanceNode } from '../scene/expand-instances'
import { isSiteKitInsertableType } from '../scene/site-kit-palette'

/** Closed map of non–Site-Kit editor types → Site Kit catalog ids. */
export const EDITOR_TO_SITE_KIT_TYPE: Readonly<Record<string, string>> = {
  Stack: 'SiteStack',
  Grid: 'SiteGrid',
  Container: 'SiteContainer',
  Box: 'SiteContainer',
  Card: 'SiteContainer',
  Panel: 'SiteContainer',
  Text: 'SiteText',
  Heading: 'SiteText',
  Lede: 'SiteText',
  Button: 'SiteButton',
  Image: 'SiteImage',
  Divider: 'SiteDivider',
  Badge: 'SiteBadge',
  Input: 'SiteInput',
  Textarea: 'SiteTextarea',
  Select: 'SiteSelect',
  Checkbox: 'SiteCheckbox',
  Link: 'SiteLink',
}

function coerceProps(
  fromType: string,
  toType: string,
  props: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(props ?? {}) }

  if (toType === 'SiteText') {
    if (next.children == null && typeof next.text === 'string') {
      next.children = next.text
    }
    delete next.text
    delete next.level
    if (fromType === 'Heading' && next.role == null) {
      next.role = 'title'
    }
    if (fromType === 'Lede' && next.role == null) {
      next.role = 'body'
    }
  }

  if (toType === 'SiteButton') {
    if (next.children == null && typeof next.label === 'string') {
      next.children = next.label
    }
    delete next.label
  }

  return sanitizeSiteKitExportProps(toType, next)
}

/**
 * Drop inspect-only keys and resolve SiteSvg mark → markup for composition SSOT.
 * `mark` is editor-only (`site-svg.md`); catalog allowlist is markup/viewBox/alt/title/name.
 */
export function sanitizeSiteKitExportProps(
  type: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...props }
  if (type === 'SiteSvg') {
    const markId = typeof next.mark === 'string' ? next.mark : null
    const markupMissing =
      next.markup == null ||
      next.markup === '' ||
      (typeof next.markup === 'string' && !next.markup.trim())
    if (markId && markId !== 'custom' && markupMissing) {
      const mark = siteSvgMark(markId)
      if (mark) {
        next.markup = mark.markup
        if (next.viewBox == null) next.viewBox = mark.viewBox
        if (next.alt == null) next.alt = mark.alt
      }
    }
    delete next.mark
  }
  return next
}

/** Deep-clone walk: rewrite known editor aliases to Site Kit types. */
export function coerceEditorNodeToSiteKit(node: SceneNode): SceneNode {
  if (isInstanceNode(node)) {
    return {
      ...node,
      ...(node.children?.length
        ? { children: node.children.map(coerceEditorNodeToSiteKit) }
        : {}),
    }
  }

  const mapped = EDITOR_TO_SITE_KIT_TYPE[node.type]
  const type = mapped ?? node.type
  const props = mapped
    ? coerceProps(node.type, type, node.props)
    : sanitizeSiteKitExportProps(type, { ...(node.props ?? {}) })

  return {
    ...node,
    type,
    props,
    ...(node.children?.length
      ? { children: node.children.map(coerceEditorNodeToSiteKit) }
      : {}),
  }
}

/** True when every non-Instance node is a Site Kit catalog type. */
export function isFullySiteKitTree(node: SceneNode): boolean {
  if (!isInstanceNode(node) && !isSiteKitInsertableType(node.type)) return false
  for (const child of node.children ?? []) {
    if (!isFullySiteKitTree(child)) return false
  }
  return true
}
