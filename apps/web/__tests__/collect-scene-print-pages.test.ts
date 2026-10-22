import { describe, expect, it } from 'vitest'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { normalizeScene } from '../lib/scene/scene-normalize'
import { collectScenePrintPages } from '../lib/magazine-pdf/collect-scene-print-pages'

function printPage(id: string) {
  return {
    id,
    type: 'PrintPage' as const,
    children: [{ id: `${id}-body`, type: 'PrintBody' as const, children: [] }],
  }
}

describe('collectScenePrintPages (Phase 1.4)', () => {
  it('walks pages[] in order and collects print pages per root', () => {
    const demo = createLegacyFixtureScene()
    const scene = normalizeScene({
      id: demo.id,
      name: demo.name,
      version: 1,
      root: {
        id: 'site',
        type: 'SiteStack',
        children: [printPage('legacy-only')],
      },
      pages: [
        {
          id: 'page-a',
          name: 'A',
          root: { id: 'ra', type: 'Stack', children: [printPage('print-a')] },
        },
        {
          id: 'page-b',
          name: 'B',
          root: { id: 'rb', type: 'Stack', children: [printPage('print-b')] },
        },
      ],
      activePageId: 'page-a',
      updatedAt: demo.updatedAt,
    })!

    const pages = collectScenePrintPages(scene)
    expect(pages.map((p) => p.id)).toEqual(['print-a', 'print-b'])
  })
})
