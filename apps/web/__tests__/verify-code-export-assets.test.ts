import { describe, it, expect } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { generateReactComponent, generateReactJsx } from '../lib/codegen/codegen-react'
import { generateTailwindHtml } from '../lib/codegen/codegen-tailwind'
import { generateSwiftUiComponent } from '../lib/codegen/codegen-swiftui'
import {
  STOCK_ASSETS,
  STOCK_ASSET_CATEGORIES,
  filterStockAssets,
} from '../lib/assets/stock-assets'

describe('Code Export Parity & Background Media Serialization', () => {
  const heroCardNode: SceneNode = {
    id: 'hero-card-1',
    type: 'Card',
    name: 'HeroCard',
    props: {
      padding: '32px',
      radius: '16px',
      backgroundImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundOverlay: 'rgba(0, 0, 0, 0.6)',
    },
    style: {
      borderColor: '#27272a',
    },
    children: [
      {
        id: 'heading-1',
        type: 'Heading',
        name: 'MainHeading',
        props: {
          text: 'Next-Gen Creation Engine',
        },
      },
      {
        id: 'text-1',
        type: 'Text',
        name: 'Subtitle',
        props: {
          text: 'Seamless parity across Web and macOS Desktop.',
        },
      },
      {
        id: 'btn-1',
        type: 'Button',
        name: 'CtaButton',
        props: {
          label: 'Get Started',
        },
      },
    ],
  }

  it('serializes container background media into inline styles in Site Kit React handoff', () => {
    const reactCode = generateReactComponent(heroCardNode, 'HeroSection')

    expect(reactCode).toContain("from '@zaoly/site-kit'")
    expect(reactCode).toContain('Container')
    expect(reactCode).toContain('Text')
    expect(reactCode).toContain('Button')

    expect(reactCode).toContain('style={{')
    expect(reactCode).toContain('backgroundImage:')
    expect(reactCode).toContain(
      "rgba(0, 0, 0, 0.6), url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80')",
    )
    expect(reactCode).toContain('backgroundSize: "cover"')
    expect(reactCode).toContain('backgroundPosition: "center"')
    expect(reactCode).toContain('backgroundRepeat: "no-repeat"')
    expect(reactCode).not.toContain('backgroundImage="https://')
  })

  it('serializes container background into Tailwind utility classes', () => {
    const tailwindHtml = generateTailwindHtml(heroCardNode)

    expect(tailwindHtml).toContain("bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80')]")
    expect(tailwindHtml).toContain('bg-cover')
    expect(tailwindHtml).toContain('bg-center')
    expect(tailwindHtml).toContain('bg-no-repeat')
    expect(tailwindHtml).toContain('<h2')
    expect(tailwindHtml).toContain('Next-Gen Creation Engine')
    expect(tailwindHtml).toContain('<button')
    expect(tailwindHtml).toContain('Get Started')
  })

  it('serializes container background into native SwiftUI view modifier', () => {
    const swiftCode = generateSwiftUiComponent(heroCardNode, 'HeroSection')

    expect(swiftCode).toContain('import SwiftUI')
    expect(swiftCode).toContain('public struct HeroSectionView: View')
    expect(swiftCode).toContain('.background(')
    expect(swiftCode).toContain('AsyncImage(url: URL(string: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80"))')
    expect(swiftCode).toContain('Text("Next-Gen Creation Engine")')
    expect(swiftCode).toContain('Text("Get Started")')
  })

  it('serializes Brandion tokenBindings as var(--ds-*) + tokenBindings map (SK-V13)', () => {
    const nodeWithTokens: SceneNode = {
      id: 'btn-token-1',
      type: 'Button',
      name: 'PrimaryActionButton',
      props: {
        label: 'Explore Catalog',
      },
      style: {
        color: '#ffffff',
        backgroundColor: '#1f44ff',
      },
      tokenBindings: {
        color: 'brand.text.primary',
        backgroundColor: 'brand.action.primary',
      },
    }

    const reactCode = generateReactComponent(nodeWithTokens, 'TokenButton')
    expect(reactCode).toContain('var(--ds-brand-text-primary)')
    expect(reactCode).toContain('var(--ds-brand-action-primary)')
    expect(reactCode).toContain('export const tokenBindings')
    expect(reactCode).toContain('"color": "brand.text.primary"')
    expect(reactCode).not.toContain("color: '#ffffff'")
    expect(reactCode).not.toContain("backgroundColor: '#1f44ff'")

    const appDs = generateReactComponent(nodeWithTokens, 'TokenButton', {
      consumer: 'zaoly-ui',
    })
    expect(appDs).toContain('color="brand.text.primary"')
    expect(appDs).toContain('backgroundColor="brand.action.primary"')
  })
})

describe('Asset Library Catalog & Filtering Logic', () => {
  it('contains curated categories and photography assets', () => {
    expect(STOCK_ASSET_CATEGORIES.length).toBeGreaterThanOrEqual(7)
    expect(STOCK_ASSETS.length).toBeGreaterThanOrEqual(10)

    const categories = new Set(STOCK_ASSETS.map((a) => a.category))
    expect(categories.has('architecture')).toBe(true)
    expect(categories.has('nature')).toBe(true)
    expect(categories.has('tech')).toBe(true)
    expect(categories.has('abstract')).toBe(true)
    expect(categories.has('minimal')).toBe(true)
    expect(categories.has('dark')).toBe(true)
  })

  it('filters stock assets by category correctly', () => {
    const natureAssets = filterStockAssets(STOCK_ASSETS, 'nature', '')
    expect(natureAssets.length).toBeGreaterThan(0)
    expect(natureAssets.every((a) => a.category === 'nature')).toBe(true)

    const archAssets = filterStockAssets(STOCK_ASSETS, 'architecture', '')
    expect(archAssets.length).toBeGreaterThan(0)
    expect(archAssets.every((a) => a.category === 'architecture')).toBe(true)
  })

  it('filters stock assets by search query matching title, author, or tags', () => {
    const mountainResults = filterStockAssets(STOCK_ASSETS, 'all', 'mountain')
    expect(mountainResults.length).toBeGreaterThan(0)
    expect(
      mountainResults.some(
        (a) =>
          a.title.toLowerCase().includes('mountain') ||
          a.tags.some((t) => t.includes('mountain')),
      ),
    ).toBe(true)

    const glassResults = filterStockAssets(STOCK_ASSETS, 'all', 'glass')
    expect(glassResults.length).toBeGreaterThan(0)
    expect(glassResults.some((a) => a.title.includes('Glass') || a.tags.includes('glass'))).toBe(true)
  })

  it('returns empty list for unmatched query without error', () => {
    const noResults = filterStockAssets(STOCK_ASSETS, 'all', 'xyznonexistentquery999')
    expect(noResults).toEqual([])
  })
})
