import assert from 'node:assert'
import { generateReactComponent } from '../lib/codegen/codegen-react.ts'
import { generateSwiftUiComponent } from '../lib/codegen/codegen-swiftui.ts'
import { generateTailwindHtml } from '../lib/codegen/codegen-tailwind.ts'
import { computeContrastRatio, lintCompositionScene } from '../lib/linter/scene-linter.ts'

const mockScene: any = {
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
        style: { color: '#222222' },
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

console.log('--- Testing P98: Code Generation Hand-off ---')

// 1. React 19 JSX
const reactCode = generateReactComponent(mockScene.root, 'HeroSection')
assert(reactCode.includes("from '@zaoly/site-kit'"))
assert(reactCode.includes('export function HeroSection() {'))
assert(reactCode.includes('<Stack'))
assert(reactCode.includes('Next-Gen Interface'))
assert(reactCode.includes('var(--ds-brand-text-primary)'))
console.log('✓ React Site Kit handoff generation passed')

// 2. SwiftUI
const swiftCode = generateSwiftUiComponent(mockScene.root, 'HeroSection')
assert(swiftCode.includes('import SwiftUI'))
assert(swiftCode.includes('public struct HeroSectionView: View'))
assert(swiftCode.includes('VStack(alignment: .leading, spacing: 16)'))
assert(swiftCode.includes('Text("Next-Gen Interface")'))
console.log('✓ Native SwiftUI View generation passed')

// 3. Tailwind CSS
const tailwindHtml = generateTailwindHtml(mockScene.root)
console.log('tailwindHtml:\n', tailwindHtml)
assert(tailwindHtml.includes('Next-Gen Interface'))
assert(tailwindHtml.includes('<img src="https://example.com/banner.jpg"'))
console.log('✓ Tailwind CSS generation passed')

console.log('--- Testing P99: Design System & A11y Linter ---')

// Contrast ratio
const whiteOnBlack = computeContrastRatio('#ffffff', '#000000')
assert(whiteOnBlack > 20, `Expected > 20, got ${whiteOnBlack}`)
const darkGreyOnBlack = computeContrastRatio('#222222', '#000000')
assert(darkGreyOnBlack < 2.0, `Expected < 2.0, got ${darkGreyOnBlack}`)
console.log(`✓ Luminance contrast math passed (${whiteOnBlack.toFixed(1)}:1 and ${darkGreyOnBlack.toFixed(1)}:1)`)

// Diagnostics
const issues = lintCompositionScene(mockScene)
console.log('Issues found:', issues.map((i: any) => `${i.severity} [${i.code}] ${i.nodeId}: ${i.message}`))
assert.strictEqual(issues.length, 5, `Expected 5 issues, got ${issues.length}`)

const contrastIssue = issues.find((i) => i.nodeId === 'bad-text-1' && i.code === 'A11Y-CONTRAST-FAIL')
assert(contrastIssue && contrastIssue.severity === 'error')
console.log('✓ Contrast failure diagnostic passed')

const btnIssue = issues.find((i) => i.nodeId === 'empty-btn-1' && i.code === 'A11Y-EMPTY-BUTTON')
assert(btnIssue && btnIssue.severity === 'error')
console.log('✓ Empty interactive element diagnostic passed')

const altIssue = issues.find((i) => i.nodeId === 'img-no-alt-1' && i.code === 'A11Y-ALT-MISSING')
assert(altIssue && altIssue.severity === 'warning')
console.log('✓ Missing image alt text diagnostic passed')

const tokenIssue = issues.find((i) => i.nodeId === 'bad-text-1' && i.code === 'DS-TOKEN-UNBOUND')
assert(tokenIssue && tokenIssue.severity === 'info')
console.log('✓ Brandion token compliance check passed')

console.log('ALL CODEGEN & LINTER TESTS PASSED PERFECTLY!')
