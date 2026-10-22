import { describe, expect, it } from 'vitest'
import type { SiteKitCompositionNode } from '@zaoly/site-kit'
import { SITE_KIT_CATALOG } from '../lib/site-kit/site-kit-catalog'
import { SITE_KIT_ATOM_PREVIEW_NODES } from '../lib/library/site-kit-atom-preview-nodes'

/** Table row/cell previews nest under SiteTable so <tr>/<td> never hydrate under a div. */
const TABLE_FRAGMENT_ATOMS = new Set(['SiteTableRow', 'SiteTableCell'])

function treeContainsType(node: SiteKitCompositionNode, type: string): boolean {
  if (node.type === type) return true
  return (node.children ?? []).some((child) => treeContainsType(child, type))
}

describe('site kit atom preview nodes', () => {
  it('covers every catalog atom with a valid preview tree', () => {
    for (const entry of SITE_KIT_CATALOG) {
      const preview = SITE_KIT_ATOM_PREVIEW_NODES[entry.id]
      expect(preview, entry.id).toBeTruthy()
      if (TABLE_FRAGMENT_ATOMS.has(entry.id)) {
        expect(preview?.type).toBe('SiteTable')
        expect(treeContainsType(preview!, entry.id)).toBe(true)
      } else {
        expect(preview?.type).toBe(entry.id)
      }
    }
  })
})
