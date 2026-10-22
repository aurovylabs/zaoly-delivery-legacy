import type { SceneNode, CompositionScene, SceneOp } from '@zaoly/contracts'
import type { InspectTokenOption } from '../inspect/token-catalog'

export type LintIssueCode =
  | 'A11Y-CONTRAST-FAIL'
  | 'A11Y-ALT-MISSING'
  | 'A11Y-EMPTY-BUTTON'
  | 'DS-TOKEN-UNBOUND'
  | 'A11Y-TOUCH-TARGET-SMALL'
  | 'A11Y-ICON-NO-ARIA'
  | 'A11Y-TAB-ORDER-DISCONTINUOUS'

export interface LintIssue {
  id: string
  nodeId: string
  nodeName: string
  severity: 'error' | 'warning' | 'info'
  code: LintIssueCode
  message: string
  fixHint?: string
  fixable?: boolean
  propKey?: string
  suggestedValue?: unknown
  suggestedTokenPath?: string
  fixActionType?: 'set-prop' | 'set-style'
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (clean.length !== 6) return null
  const num = parseInt(clean, 16)
  if (isNaN(num)) return null
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function channelLuminance(c: number): number {
  const norm = c / 255
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  )
}

export function computeContrastRatio(fgHex: string, bgHex: string): number {
  const fg = hexToRgb(fgHex)
  const bg = hexToRgb(bgHex)
  if (!fg || !bg) return 21 // Fallback
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export const DEFAULT_PACK_COLORS: { path: string; hex: string }[] = [
  { path: 'color.action.primary', hex: '#f256b6' },
  { path: 'color.action.secondary', hex: '#1a1a1a' },
  { path: 'color.action.accent', hex: '#b8e70d' },
  { path: 'color.background', hex: '#0f0f12' },
  { path: 'color.neutral.100', hex: '#f5f5f7' },
  { path: 'color.black', hex: '#000000' },
  { path: 'color.neutral.700', hex: '#3a3a42' },
]

export function extractHexFromToken(token: InspectTokenOption): string | null {
  if (typeof token.preview === 'string' && token.preview.startsWith('#')) {
    return token.preview
  }
  if (token.value && typeof token.value === 'object') {
    const val = token.value as Record<string, unknown>
    const digital = val.digital as Record<string, unknown> | undefined
    if (digital && typeof digital.hex === 'string' && digital.hex.startsWith('#')) {
      return digital.hex
    }
  }
  return null
}

export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return Infinity
  const dr = rgb1.r - rgb2.r
  const dg = rgb1.g - rgb2.g
  const db = rgb1.b - rgb2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

export function findNearestPackColorToken(
  targetHex: string,
  kind: 'color' | 'background' = 'color',
  catalog?: InspectTokenOption[],
): string {
  const cleanHex = targetHex.trim()
  const colorTokens: { path: string; hex: string }[] = []

  if (catalog && catalog.length > 0) {
    for (const opt of catalog) {
      if (opt.group === 'color' || opt.type === 'color') {
        const hex = extractHexFromToken(opt)
        if (hex) {
          colorTokens.push({ path: opt.path, hex })
        }
      }
    }
  }

  const pool = colorTokens.length > 0 ? colorTokens : DEFAULT_PACK_COLORS

  let bestPath = pool[0].path
  let minDistance = Infinity

  for (const item of pool) {
    // If exact match
    if (item.hex.toLowerCase() === cleanHex.toLowerCase()) {
      return item.path
    }
    const dist = colorDistance(cleanHex, item.hex)
    if (dist < minDistance) {
      minDistance = dist
      bestPath = item.path
    }
  }

  // Fallback defaults if distance was infinite
  if (minDistance === Infinity) {
    return kind === 'background' ? 'color.background' : 'color.neutral.100'
  }

  return bestPath
}

export function lintSceneNode(
  node: SceneNode,
  parentBgHex = '#18181b',
  issues: LintIssue[] = [],
  catalog?: InspectTokenOption[],
): LintIssue[] {
  const rawType = node.type || (node as any).component || 'Box'
  const tag = rawType.startsWith('Site') ? rawType.replace('Site', '') : rawType
  const nodeName = node.name || tag

  // Determine current node's background color (checking token bindings, props, and style)
  let bgRaw: string | undefined
  if (node.tokenBindings?.background || node.tokenBindings?.backgroundColor) {
    const boundPath = node.tokenBindings.background || node.tokenBindings.backgroundColor
    const opt = catalog?.find((c) => c.path === boundPath)
    bgRaw = (opt ? extractHexFromToken(opt) : null) || DEFAULT_PACK_COLORS.find((c) => c.path === boundPath)?.hex
  }
  if (!bgRaw || !bgRaw.startsWith('#')) {
    bgRaw =
      (node.props?.backgroundColor as string) ||
      (node.props?.background as string) ||
      (node.style?.backgroundColor as string) ||
      (node.style?.background as string) ||
      parentBgHex
  }
  const currentBg = bgRaw.startsWith('#') ? bgRaw : parentBgHex
  const currentBgRgb = hexToRgb(currentBg)

  // 1. Accessibility: Missing Image Alt Text
  if (tag === 'Image') {
    const alt = node.props?.alt as string | undefined
    if (!alt || alt.trim() === '') {
      issues.push({
        id: `alt-${node.id}`,
        nodeId: node.id,
        nodeName,
        severity: 'warning',
        code: 'A11Y-ALT-MISSING',
        message: 'Image is missing an accessible alt description.',
        fixHint: 'Add descriptive alt text for screen readers in the Media Inspector.',
        fixable: true,
        propKey: 'alt',
        suggestedValue: nodeName ? `${nodeName} image` : 'Image asset',
      })
    }
  }

  // 2. Accessibility: Empty Interactive Elements
  if (tag === 'Button') {
    const label = (node.props?.label as string) || ''
    const children = (node.props?.children as string) || ''
    const ariaLabel = (node.props?.['aria-label'] as string) || ''
    const hasChildNodes = Boolean(node.children && node.children.length > 0)
    if (!label.trim() && !children.trim() && !ariaLabel.trim() && !hasChildNodes) {
      issues.push({
        id: `btn-${node.id}`,
        nodeId: node.id,
        nodeName,
        severity: 'error',
        code: 'A11Y-EMPTY-BUTTON',
        message: 'Button has no accessible text or aria-label.',
        fixHint: 'Add button text or an aria-label attribute.',
        fixable: true,
        propKey: 'label',
        suggestedValue: nodeName && nodeName !== 'Button' ? nodeName : 'Action',
      })
    }

    // 2b. Accessibility: Icon-Only Button Missing Aria Label
    const hasText = label.trim().length > 0 || (typeof children === 'string' && children.trim().length > 0)
    if (!hasText && !ariaLabel.trim()) {
      issues.push({
        id: `aria-icon-${node.id}`,
        nodeId: node.id,
        nodeName,
        severity: 'error',
        code: 'A11Y-ICON-NO-ARIA',
        message: 'Icon-only button lacks an accessible name for screen readers (WCAG 4.1.2).',
        fixHint: 'Add an aria-label describing the button action.',
        fixable: true,
        propKey: 'aria-label',
        suggestedValue: nodeName && nodeName !== 'Button' ? nodeName : 'Action',
      })
    }
  }

  // 2c. Accessibility: Touch Target Sizing (WCAG 2.5.8)
  if (tag === 'Button' || tag === 'Input') {
    const minW = parseFloat(String(node.style?.minWidth || node.style?.width || node.props?.width || ''))
    const minH = parseFloat(String(node.style?.minHeight || node.style?.height || node.props?.height || ''))
    if ((minW > 0 && minW < 44) || (minH > 0 && minH < 44)) {
      issues.push({
        id: `touch-${node.id}`,
        nodeId: node.id,
        nodeName,
        severity: 'warning',
        code: 'A11Y-TOUCH-TARGET-SMALL',
        message: `Interactive element dimensions are smaller than 44x44px (${minW || '?'}x${minH || '?'}px) (WCAG 2.5.8).`,
        fixHint: 'Enforce minimum touch target of 44x44px.',
        fixable: true,
        fixActionType: 'set-style',
        propKey: 'minHeight',
        suggestedValue: '44px',
      })
    }
  }

  // 2d. Focus Navigation: Positive tabindex disruption (WCAG 2.4.3)
  if (node.props?.tabIndex !== undefined && Number(node.props.tabIndex) > 0) {
    issues.push({
      id: `tabindex-${node.id}`,
      nodeId: node.id,
      nodeName,
      severity: 'warning',
      code: 'A11Y-TAB-ORDER-DISCONTINUOUS',
      message: `Positive tabindex (${node.props.tabIndex}) disrupts natural sequential keyboard navigation (WCAG 2.4.3).`,
      fixHint: 'Reset tabindex to 0 for standard DOM flow.',
      fixable: true,
      propKey: 'tabIndex',
      suggestedValue: 0,
    })
  }

  // 3. Contrast Check for Text Elements
  if (tag === 'Text' || tag === 'Heading' || tag === 'Lede') {
    let colorRaw =
      (node.props?.color as string) || (node.style?.color as string) || '#ffffff'
    if (node.tokenBindings?.color) {
      const boundPath = node.tokenBindings.color
      const opt = catalog?.find((c) => c.path === boundPath)
      const tokenHex = (opt ? extractHexFromToken(opt) : null) || DEFAULT_PACK_COLORS.find((c) => c.path === boundPath)?.hex
      if (tokenHex) {
        colorRaw = tokenHex
      }
    }

    if (colorRaw.startsWith('#') && currentBg.startsWith('#')) {
      const ratio = computeContrastRatio(colorRaw, currentBg)
      const minRatio = tag === 'Heading' ? 3.0 : 4.5
      if (ratio < minRatio) {
        const bgLum = currentBgRgb ? relativeLuminance(currentBgRgb) : 0
        const highContrastColor = bgLum < 0.5 ? '#ffffff' : '#0f172a'
        issues.push({
          id: `contrast-${node.id}`,
          nodeId: node.id,
          nodeName,
          severity: 'error',
          code: 'A11Y-CONTRAST-FAIL',
          message: `Low contrast ratio (${ratio.toFixed(1)}:1 vs ${minRatio}:1 WCAG AA threshold).`,
          fixHint: 'Adjust text or background color to increase contrast.',
          fixable: true,
          propKey: 'color',
          suggestedValue: highContrastColor,
        })
      }
    }
  }

  // 4. Token pack compliance
  const color =
    (node.props?.color as string | undefined) ||
    (node.style?.color as string | undefined)
  const bg =
    (node.props?.backgroundColor as string | undefined) ||
    (node.props?.background as string | undefined) ||
    (node.style?.backgroundColor as string | undefined) ||
    (node.style?.background as string | undefined)
  const hasColorBinding = Boolean(node.tokenBindings?.color)
  const hasBgBinding = Boolean(
    node.tokenBindings?.background || node.tokenBindings?.backgroundColor,
  )

  if (color && color.startsWith('#') && !hasColorBinding) {
    const suggestedTokenPath = findNearestPackColorToken(color, 'color', catalog)
    issues.push({
      id: `token-color-${node.id}`,
      nodeId: node.id,
      nodeName,
      severity: 'info',
      code: 'DS-TOKEN-UNBOUND',
      message: `Color "${color}" is hardcoded instead of bound to a brand token.`,
      fixHint: 'Use the Token Picker in the inspector to link to a token pack color.',
      fixable: true,
      propKey: 'color',
      suggestedTokenPath,
    })
  }

  if (bg && bg.startsWith('#') && !hasBgBinding) {
    const suggestedTokenPath = findNearestPackColorToken(bg, 'background', catalog)
    issues.push({
      id: `token-bg-${node.id}`,
      nodeId: node.id,
      nodeName,
      severity: 'info',
      code: 'DS-TOKEN-UNBOUND',
      message: `Background "${bg}" is hardcoded instead of bound to a brand token.`,
      fixHint: 'Use the Token Picker in the inspector to link to a token pack background token.',
      fixable: true,
      propKey: 'backgroundColor',
      suggestedTokenPath,
    })
  }

  // Recursively lint children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      lintSceneNode(child, currentBg, issues, catalog)
    }
  }

  return issues
}

export function lintCompositionScene(
  scene: CompositionScene,
  catalog?: InspectTokenOption[],
): LintIssue[] {
  const issues: LintIssue[] = []
  if (scene.pages && scene.pages.length > 0) {
    for (const page of scene.pages) {
      lintSceneNode(page.root, '#18181b', issues, catalog)
    }
  } else {
    lintSceneNode(scene.root, '#18181b', issues, catalog)
  }
  return issues
}

function findNodeRecursive(root: SceneNode, id: string): SceneNode | null {
  if (root.id === id) return root
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeRecursive(child, id)
      if (found) return found
    }
  }
  return null
}

export function findNodeInScene(scene: CompositionScene, nodeId: string): SceneNode | null {
  if (scene.pages && scene.pages.length > 0) {
    for (const page of scene.pages) {
      const found = findNodeRecursive(page.root, nodeId)
      if (found) return found
    }
  }
  return findNodeRecursive(scene.root, nodeId)
}

/**
 * Generates 1-Click Auto-Fix SceneOp(s) for a specific LintIssue.
 */
export function autoFixLintIssue(
  issue: LintIssue,
  scene: CompositionScene,
  catalog?: InspectTokenOption[],
): SceneOp[] {
  const ops: SceneOp[] = []

  if (issue.code === 'A11Y-CONTRAST-FAIL') {
    const value = (issue.suggestedValue as string) || '#ffffff'
    ops.push({ op: 'set_prop', nodeId: issue.nodeId, key: 'color', value })
    const tokenPath = value === '#ffffff' ? 'color.neutral.100' : 'color.action.secondary'
    ops.push({ op: 'set_token_binding', nodeId: issue.nodeId, key: 'color', tokenPath })
  } else if (issue.code === 'A11Y-ALT-MISSING') {
    const value = (issue.suggestedValue as string) || 'Image asset'
    ops.push({ op: 'set_prop', nodeId: issue.nodeId, key: 'alt', value })
  } else if (issue.code === 'A11Y-EMPTY-BUTTON') {
    const value = (issue.suggestedValue as string) || 'Action'
    ops.push({ op: 'set_prop', nodeId: issue.nodeId, key: 'label', value })
    ops.push({ op: 'set_prop', nodeId: issue.nodeId, key: 'children', value })
  } else if (issue.code === 'DS-TOKEN-UNBOUND') {
    const key =
      issue.propKey || (issue.id.includes('token-color') ? 'color' : 'backgroundColor')
    let tokenPath = issue.suggestedTokenPath
    if (!tokenPath) {
      const node = findNodeInScene(scene, issue.nodeId)
      const rawColor =
        key === 'color'
          ? ((node?.props?.color || node?.style?.color) as string)
          : ((node?.props?.backgroundColor ||
              node?.props?.background ||
              node?.style?.backgroundColor ||
              node?.style?.background) as string)
      tokenPath = findNearestPackColorToken(
        rawColor || '#ffffff',
        key === 'color' ? 'color' : 'background',
        catalog,
      )
    }
    ops.push({ op: 'set_token_binding', nodeId: issue.nodeId, key, tokenPath })
  } else if (issue.code === 'A11Y-ICON-NO-ARIA') {
    const value = (issue.suggestedValue as string) || 'Action'
    ops.push({ op: 'set_prop', nodeId: issue.nodeId, key: 'aria-label', value })
  } else if (issue.code === 'A11Y-TOUCH-TARGET-SMALL') {
    ops.push({ op: 'set_prop', nodeId: issue.nodeId, key: 'minHeight', value: '44px' })
    ops.push({ op: 'set_prop', nodeId: issue.nodeId, key: 'minWidth', value: '44px' })
  } else if (issue.code === 'A11Y-TAB-ORDER-DISCONTINUOUS') {
    ops.push({ op: 'set_prop', nodeId: issue.nodeId, key: 'tabIndex', value: 0 })
  }

  return ops
}

/**
 * Generates 1-Click Auto-Fix SceneOp(s) for all fixable issues in the scene.
 */
export function autoFixAllLintIssues(
  issues: LintIssue[],
  scene: CompositionScene,
  catalog?: InspectTokenOption[],
): SceneOp[] {
  const allOps: SceneOp[] = []
  const boundKeys = new Set<string>()

  // Process high severity (errors/warnings) before info tokens so contrast fixes take precedence
  const sortedIssues = [...issues].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })

  for (const issue of sortedIssues) {
    if (issue.fixable !== false) {
      const key = issue.propKey || (issue.id.includes('token-color') ? 'color' : 'backgroundColor')
      const target = `${issue.nodeId}:${key}`
      if (issue.code === 'DS-TOKEN-UNBOUND' && boundKeys.has(target)) {
        continue
      }
      const ops = autoFixLintIssue(issue, scene, catalog)
      for (const op of ops) {
        allOps.push(op)
        if (op.op === 'set_token_binding') {
          boundKeys.add(`${op.nodeId}:${op.key}`)
        }
      }
    }
  }
  return allOps
}
