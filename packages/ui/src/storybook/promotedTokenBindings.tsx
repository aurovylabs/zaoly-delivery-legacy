import React, { useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

export type TokenBindings = Record<string, string>

function colorTokenToCssVarRef(tokenPath: string): string {
  switch (tokenPath) {
    case 'color.action.primary':
      return 'var(--accent)'
    case 'color.muted':
      return 'var(--muted)'
    case 'color.line':
      return 'var(--line)'
    case 'color.ink':
      return 'var(--ink)'
    case 'color.status.danger':
      return 'var(--danger)'
    // Promoted Text story currently uses this token path for foreground.
    case 'color.neutral.700':
      return 'var(--ink)'
    default:
      return 'var(--ink)'
  }
}

function radiusTokenToCssVarRef(tokenPath: string): string {
  switch (tokenPath) {
    case 'radius.sm':
      return 'var(--radius-sm)'
    case 'radius.md':
      return 'var(--radius-md)'
    case 'radius.panel':
      return 'var(--radius-panel)'
    case 'radius.pill':
      return 'var(--radius-pill)'
    // CREATION default for buttons is `var(--ds-radius-xl)`; zaoly-ui doesn’t have an xl tier.
    case 'radius.xl':
      return 'var(--radius-panel)'
    case 'radius.full':
      return 'var(--radius-pill)'
    default:
      return 'var(--radius-md)'
  }
}

function typographyHeadingH1ToInline(): CSSProperties {
  // CREATION token path → Storybook CSS variable mapping.
  return {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--type-display)',
    fontWeight: 'var(--weight-bold)',
    letterSpacing: 'var(--track-display)',
    // `typography.css` currently hardcodes line-height; for promoted stories we override inline.
    lineHeight: 1.12 as unknown as string,
  }
}

function resolveInlineFromTokenPath(tokenPath: string): CSSProperties | null {
  switch (tokenPath) {
    case 'typography.heading.h1':
      return typographyHeadingH1ToInline()
    default:
      return null
  }
}

/**
 * Applies CREATION promoted `tokenBindings` (token paths) to zaoly-ui CSS vars / inline styles.
 *
 * This intentionally focuses on the pilot component surface area (ds-button + current promoted Text).
 * Extend the token mappings when additional promoted component kinds are added.
 */
export function applyPromotedTokenBindings(root: HTMLElement, tokenBindings: TokenBindings): void {
  if (!tokenBindings || typeof tokenBindings !== 'object') return

  const keys = Object.keys(tokenBindings)
  const looksLikeButton = keys.some((k) => k === 'color' || k === 'radius' || k === 'background')
  const looksLikeText = keys.some(
    (k) => k === 'fontFamily' || k === 'fontSize' || k === 'fontWeight' || k === 'lineHeight' || k === 'letterSpacing' || k === 'color',
  )

  if (looksLikeButton) {
    const btns = Array.from(root.querySelectorAll<HTMLElement>('.ds-btn'))
    for (const el of btns) {
      const colorPath = tokenBindings.color
      if (colorPath) {
        // Primary background in zaoly-ui is `background: var(--accent)`.
        el.style.setProperty('--accent', colorTokenToCssVarRef(colorPath))
      }

      const radiusPath = tokenBindings.radius
      if (radiusPath) {
        el.style.borderRadius = radiusTokenToCssVarRef(radiusPath)
      }

      // Some promoted instances might carry `background` too (secondary/ghost in CREATION).
      // For now we only map it onto --accent so visual deltas are observable.
      const backgroundPath = tokenBindings.background
      if (backgroundPath) {
        el.style.setProperty('--accent', colorTokenToCssVarRef(backgroundPath))
      }
    }
  }

  if (looksLikeText) {
    const textEls = Array.from(root.querySelectorAll<HTMLElement>('[class*="ds-text-"]'))
    for (const el of textEls) {
      const anyPath = tokenBindings.fontFamily ?? tokenBindings.fontSize ?? tokenBindings.fontWeight
      if (anyPath) {
        const inline = resolveInlineFromTokenPath(anyPath)
        if (inline) {
          Object.entries(inline).forEach(([k, v]) => {
            // `CSSStyleDeclaration` braucht camelCase Property-Namen für Direktzuweisung.
            ;(el.style as any)[k] = v
          })
        }
      }

      const fgPath = tokenBindings.color
      if (fgPath) {
        el.style.color = colorTokenToCssVarRef(fgPath)
      }
    }
  }
}

export function PromotedTokenBindingsApplier({
  tokenBindings,
  children,
}: {
  tokenBindings?: TokenBindings
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (!ref.current) return
    applyPromotedTokenBindings(ref.current, tokenBindings ?? {})
  }, [tokenBindings])

  return <div ref={ref}>{children}</div>
}

