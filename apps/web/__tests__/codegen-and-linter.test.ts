import { describe, it, expect } from 'vitest'
import type { SceneNode, CompositionScene } from '@zaoly/contracts'
import { generateReactComponent, generateReactJsx } from '../lib/codegen/codegen-react'
import { generateSwiftUiComponent, generateSwiftUiView } from '../lib/codegen/codegen-swiftui'
import { generateTailwindHtml } from '../lib/codegen/codegen-tailwind'
import {
  computeContrastRatio,
  lintSceneNode,
  lintCompositionScene,
  autoFixLintIssue,
  autoFixAllLintIssues,
} from '../lib/linter/scene-linter'
import { applySceneOpBatch } from '../lib/scene/apply-scene-op-batch'

const mockScene: CompositionScene = {
  schemaVersion: '2026-05-plexon-federation-v3',
  id: 'test-scene',
  projectId: 'proj-1',
  name: 'Test Scene',
  root: {
    id: 'root-1',
    type: 'Stack',
    name: 'HeroStack',
    props: { direction: 'column', gap: '24px' },
    style: { backgroundColor: '#000000', padding: '32px' },
    children: [
      {
        id: 'heading-1',
        type: 'Heading',
        name: 'MainHeading',
        props: { text: 'Next-Gen Interface' },
        style: { color: '#ffffff', fontSize: '32px' },
        tokenBindings: { color: 'brand.text.primary' },
      },
      {
        id: 'bad-text-1',
        type: 'Text',
        name: 'LowContrastText',
        props: { text: 'Invisible subtle text' },
        style: { color: '#222222' }, // Low contrast against #000000
      },
      {
        id: 'empty-btn-1',
        type: 'Button',
        name: 'EmptyButton',
        props: {},
      },
      {
        id: 'img-no-alt-1',
        type: 'Image',
        name: 'HeroImage',
        props: { src: 'https://example.com/banner.jpg' },
      },
    ],
  },
}

describe('P98: Code Generation Hand-off', () => {
  it('defaults to Site Kit + token pack var(--ds-*) grammar (SK-V13)', () => {
    const code = generateReactComponent(mockScene.root, 'HeroSection')
    expect(code).toContain("from '@zaoly/site-kit'")
    expect(code).toContain('export function HeroSection() {')
    expect(code).toContain('<Stack')
    expect(code).toContain('Next-Gen Interface')
    expect(code).toContain('var(--ds-brand-text-primary)')
    expect(code).toContain('export const tokenBindings')
  })

  it('still generates idiomatic React 19 JSX with @zaoly/ui when requested', () => {
    const code = generateReactComponent(mockScene.root, 'HeroSection', {
      consumer: 'zaoly-ui',
    })
    expect(code).toContain("from '@zaoly/ui'")
    expect(code).toContain('Button')
    expect(code).toContain('Stack')
    expect(code).toContain('Text')
    expect(code).toContain('export function HeroSection() {')
    expect(code).toContain('<Stack')
    expect(code).toContain('Next-Gen Interface')
  })

  it('pretty-prints multi-attr open tags and multi-key style (Kit SK-V8 rules)', () => {
    const code = generateReactComponent(mockScene.root, 'HeroSection')
    expect(code).toMatch(/<Stack\n\s+direction=\{/)
    expect(code).toMatch(/style=\{\{\n\s+backgroundColor:/)
    const jsx = generateReactJsx(mockScene.root)
    expect(jsx.split('\n').length).toBeGreaterThan(8)
  })

  it('generates native SwiftUI View hierarchy', () => {
    const code = generateSwiftUiComponent(mockScene.root, 'HeroSection')
    expect(code).toContain('import SwiftUI')
    expect(code).toContain('public struct HeroSectionView: View')
    expect(code).toContain('VStack(alignment: .leading, spacing: 16)')
    expect(code).toContain('Text("Next-Gen Interface")')
    expect(code).toContain('.font(.system(size: 28, weight: .bold))')
  })

  it('generates clean Tailwind CSS markup', () => {
    const html = generateTailwindHtml(mockScene.root)
    expect(html).toContain('class="flex flex-col gap-4 p-8 bg-zinc-900 border border-zinc-800"')
    expect(html).toContain('Next-Gen Interface')
    expect(html).toContain('<img src="https://example.com/banner.jpg"')
  })
})

describe('P99: Design System & A11y Linter', () => {
  it('accurately computes luminance contrast ratios according to WCAG formula', () => {
    // White on Black: ~21:1
    const whiteOnBlack = computeContrastRatio('#ffffff', '#000000')
    expect(whiteOnBlack).toBeGreaterThan(20)

    // Dark grey (#222222) on Black (#000000): ~1.3:1 (fails AA)
    const darkGreyOnBlack = computeContrastRatio('#222222', '#000000')
    expect(darkGreyOnBlack).toBeLessThan(2.0)
  })

  it('flags contrast failures, missing alt text, empty buttons, and unbound tokens', () => {
    const issues = lintCompositionScene(mockScene)
    
    // Contrast failure on bad-text-1
    const contrastIssue = issues.find((i) => i.nodeId === 'bad-text-1' && i.code === 'A11Y-CONTRAST-FAIL')
    expect(contrastIssue).toBeDefined()
    expect(contrastIssue?.severity).toBe('error')

    // Empty button on empty-btn-1
    const btnIssue = issues.find((i) => i.nodeId === 'empty-btn-1' && i.code === 'A11Y-EMPTY-BUTTON')
    expect(btnIssue).toBeDefined()
    expect(btnIssue?.severity).toBe('error')

    // Missing alt on img-no-alt-1
    const altIssue = issues.find((i) => i.nodeId === 'img-no-alt-1' && i.code === 'A11Y-ALT-MISSING')
    expect(altIssue).toBeDefined()
    expect(altIssue?.severity).toBe('warning')

    // Unbound token on bad-text-1 (#222222 has no tokenBindings)
    const tokenIssue = issues.find((i) => i.nodeId === 'bad-text-1' && i.code === 'DS-TOKEN-UNBOUND')
    expect(tokenIssue).toBeDefined()
    expect(tokenIssue?.severity).toBe('info')

    // Heading-1 has tokenBindings.color, so no DS-TOKEN-UNBOUND issue for its color
    const headingTokenIssue = issues.find((i) => i.nodeId === 'heading-1' && i.code === 'DS-TOKEN-UNBOUND')
    expect(headingTokenIssue).toBeUndefined()
  })

  it('generates precise 1-Click Auto-Fix operations for single issues', () => {
    const issues = lintCompositionScene(mockScene)

    // 1. Contrast fix -> sets color to high-contrast white and binds high-contrast token
    const contrastIssue = issues.find((i) => i.code === 'A11Y-CONTRAST-FAIL')!
    const contrastOps = autoFixLintIssue(contrastIssue, mockScene)
    expect(contrastOps).toHaveLength(2)
    expect(contrastOps[0]).toMatchObject({
      op: 'set_prop',
      nodeId: 'bad-text-1',
      key: 'color',
      value: '#ffffff',
    })
    expect(contrastOps[1]).toMatchObject({
      op: 'set_token_binding',
      nodeId: 'bad-text-1',
      key: 'color',
      tokenPath: 'color.neutral.100',
    })

    // 2. Alt missing fix -> sets alt text
    const altIssue = issues.find((i) => i.code === 'A11Y-ALT-MISSING')!
    const altOps = autoFixLintIssue(altIssue, mockScene)
    expect(altOps).toHaveLength(1)
    expect(altOps[0]).toMatchObject({
      op: 'set_prop',
      nodeId: 'img-no-alt-1',
      key: 'alt',
      value: 'HeroImage image',
    })

    // 3. Empty button fix -> sets accessible text
    const btnIssue = issues.find((i) => i.code === 'A11Y-EMPTY-BUTTON')!
    const btnOps = autoFixLintIssue(btnIssue, mockScene)
    expect(btnOps.length).toBeGreaterThanOrEqual(1)
    expect(btnOps[0]).toMatchObject({
      op: 'set_prop',
      nodeId: 'empty-btn-1',
      key: 'label',
      value: 'EmptyButton',
    })

    // 4. Token unbound fix -> binds to closest token pack color
    const tokenIssue = issues.find((i) => i.code === 'DS-TOKEN-UNBOUND' && i.nodeId === 'bad-text-1')!
    const tokenOps = autoFixLintIssue(tokenIssue, mockScene)
    expect(tokenOps).toHaveLength(1)
    expect(tokenOps[0]).toMatchObject({
      op: 'set_token_binding',
      nodeId: 'bad-text-1',
      key: 'color',
    })
  })

  it('resolves all accessibility and design system violations via Auto-Fix All', () => {
    const initialIssues = lintCompositionScene(mockScene)
    expect(initialIssues.length).toBeGreaterThanOrEqual(4)

    const fixOps = autoFixAllLintIssues(initialIssues, mockScene)
    expect(fixOps.length).toBeGreaterThanOrEqual(4)

    const batchResult = applySceneOpBatch(mockScene, fixOps)
    expect(batchResult.ok).toBe(true)

    // Re-lint the updated scene: errors and warnings should be 0!
    const remainingIssues = lintCompositionScene(batchResult.scene)
    const severeIssues = remainingIssues.filter((i) => i.severity === 'error' || i.severity === 'warning')
    expect(severeIssues).toHaveLength(0)
  })
})
