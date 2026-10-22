import type { LibraryCatalogFixture, LibraryComponentSummary } from '@zaoly/contracts'

/**
 * Offline library fixture — historical WC/tag snapshot for MCP / API orientation.
 * Product Library hub SoT is Site Kit (`SITE_KIT_CATALOG` + site-kit compositions).
 * See `knowledge/library-fixture-sources.md`.
 */
function layerFromCategory(category: string): LibraryComponentSummary['layer'] {
  if (category.startsWith('Molecules/')) return 'molecule'
  if (category.startsWith('Shell/') || category.startsWith('Organisms/')) return 'shell'
  return 'atom'
}

const ITEMS: Omit<LibraryComponentSummary, 'layer'>[] = [
  { tagName: 'ds-button', category: 'Atoms/Actions', contractVersion: '1.0.0', propCount: 24, tokenBindablePropCount: 19 },
  { tagName: 'ds-input', category: 'Atoms/Forms', contractVersion: '1.0.0', propCount: 17, tokenBindablePropCount: 11 },
  { tagName: 'ds-select', category: 'Atoms/Forms', contractVersion: '1.0.0', propCount: 17, tokenBindablePropCount: 11 },
  { tagName: 'ds-textarea', category: 'Atoms/Forms', contractVersion: '1.0.0', propCount: 17, tokenBindablePropCount: 11 },
  { tagName: 'ds-checkbox', category: 'Atoms/Forms', contractVersion: '1.0.0', propCount: 16, tokenBindablePropCount: 11 },
  { tagName: 'ds-switch', category: 'Atoms/Forms', contractVersion: '1.0.0', propCount: 16, tokenBindablePropCount: 11 },
  { tagName: 'ds-badge', category: 'Atoms/Surfaces', contractVersion: '1.0.0', propCount: 15, tokenBindablePropCount: 11 },
  { tagName: 'ds-card', category: 'Atoms/Surfaces', contractVersion: '1.0.0', propCount: 13, tokenBindablePropCount: 11 },
  { tagName: 'ds-chip', category: 'Molecules/Actions', contractVersion: '1.0.0', propCount: 18, tokenBindablePropCount: 11 },
  { tagName: 'ds-avatar', category: 'Atoms/Media', contractVersion: '1.0.0', propCount: 14, tokenBindablePropCount: 9 },
  { tagName: 'ds-icon', category: 'Atoms/Media', contractVersion: '1.0.0', propCount: 12, tokenBindablePropCount: 7 },
  { tagName: 'ds-accordion', category: 'Molecules/Disclosure', contractVersion: '1.0.0', propCount: 10, tokenBindablePropCount: 10 },
  { tagName: 'ds-tabs', category: 'Molecules/Navigation', contractVersion: '1.0.0', propCount: 13, tokenBindablePropCount: 10 },
  { tagName: 'ds-breadcrumb', category: 'Molecules/Navigation', contractVersion: '1.0.0', propCount: 10, tokenBindablePropCount: 9 },
  { tagName: 'ds-drawer', category: 'Molecules/Overlay', contractVersion: '1.0.0', propCount: 20, tokenBindablePropCount: 14 },
  { tagName: 'ds-nav', category: 'Atoms/Layout', contractVersion: '1.0.0', propCount: 14, tokenBindablePropCount: 9 },
  { tagName: 'ds-table', category: 'Molecules/Data', contractVersion: '1.0.0', propCount: 10, tokenBindablePropCount: 10 },
]

export function getLibraryCatalog(): LibraryCatalogFixture {
  return {
    libraryVersion: '1.0.0',
    generatedAt: '2026-08-12T00:00:00.000Z',
    sourceNote:
      'Offline fixture catalog for API/MCP — product Library hub SoT is Site Kit (@zaoly/ui + site-kit compositions)',
    items: ITEMS.map((row) => ({
      ...row,
      layer: layerFromCategory(row.category),
    })),
  }
}

export function groupLibraryByCategory(
  items: LibraryComponentSummary[],
): Array<{ category: string; items: LibraryComponentSummary[] }> {
  const map = new Map<string, LibraryComponentSummary[]>()
  for (const item of items) {
    const list = map.get(item.category) ?? []
    list.push(item)
    map.set(item.category, list)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, groupItems]) => ({
      category,
      items: groupItems.sort((a, b) => a.tagName.localeCompare(b.tagName)),
    }))
}
