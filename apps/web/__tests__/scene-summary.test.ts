import { describe, expect, it } from 'vitest'
import type { CompositionScene, ProjectSummary } from '@zaoly/contracts'
import { createBlankScene } from '../lib/scene/blank-scene'
import {
  compositionEditorHref,
  enrichProjectsWithSceneCounts,
  filterScenesForProjects,
  sceneToCompositionSummary,
  sortScenesByUpdatedAtDesc,
} from '../lib/scene/scene-summary'

const scene = (over: Partial<CompositionScene>): CompositionScene => ({
  id: 's1',
  name: 'A',
  version: 1,
  platformProjectId: 'plx-1',
  root: { id: 'r', type: 'SiteStack', children: [] },
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...over,
})

describe('blank scene + scene summary', () => {
  it('createBlankScene builds a SiteStack root', () => {
    const blank = createBlankScene({ name: '  Hero  ', platformProjectId: 'plx-9' })
    expect(blank.name).toBe('Hero')
    expect(blank.platformProjectId).toBe('plx-9')
    expect(blank.root.type).toBe('SiteStack')
    expect(blank.version).toBe(1)
  })

  it('createBlankScene allows standalone unbound scenes', () => {
    const blank = createBlankScene({ name: 'Solo', ownerUserId: 'dev-local' })
    expect(blank.platformProjectId).toBeNull()
    expect(blank.ownerUserId).toBe('dev-local')
  })

  it('maps scene to CompositionSummary and editor href', () => {
    const s = scene({
      id: 'scene-x',
      name: 'X',
      platformProjectId: 'plx-2',
      pages: [
        { id: 'page-a', name: 'A', root: { id: 'ra', type: 'SiteStack', children: [] } },
        { id: 'page-b', name: 'B', root: { id: 'rb', type: 'SiteStack', children: [] } },
      ],
      activePageId: 'page-b',
      coverPageId: 'page-b',
    })
    expect(sceneToCompositionSummary(s)).toMatchObject({
      id: 'scene-x',
      name: 'X',
      status: 'draft',
      platformProjectId: 'plx-2',
      previewPageId: 'page-b',
    })
    expect(compositionEditorHref(s)).toBe(
      '/editor?sceneId=scene-x&platformProjectId=plx-2',
    )
  })

  it('previewPageId falls back to first page when cover missing', () => {
    const s = scene({
      pages: [
        { id: 'page-a', name: 'A', root: { id: 'ra', type: 'SiteStack', children: [] } },
        { id: 'page-b', name: 'B', root: { id: 'rb', type: 'SiteStack', children: [] } },
      ],
      activePageId: 'page-b',
    })
    expect(sceneToCompositionSummary(s).previewPageId).toBe('page-a')
  })

  it('filters and sorts scenes for projects', () => {
    const projects: ProjectSummary[] = [
      {
        id: 'p1',
        name: 'P',
        status: 'active',
        platformProjectId: 'plx-1',
        capabilityStatus: 'in_sync',
        lastActivityAt: null,
        compositionCount: 0,
      },
    ]
    const list = sortScenesByUpdatedAtDesc(
      filterScenesForProjects(
        [
          scene({ id: 'old', updatedAt: '2020-01-01T00:00:00.000Z' }),
          scene({ id: 'new', updatedAt: '2026-01-01T00:00:00.000Z' }),
          scene({ id: 'other', platformProjectId: 'plx-other' }),
        ],
        projects,
      ),
    )
    expect(list.map((s) => s.id)).toEqual(['new', 'old'])
  })

  it('enriches compositionCount from scenes', () => {
    const projects: ProjectSummary[] = [
      {
        id: 'p1',
        name: 'P',
        status: 'active',
        platformProjectId: 'plx-1',
        capabilityStatus: 'in_sync',
        lastActivityAt: null,
        compositionCount: 99,
      },
    ]
    const enriched = enrichProjectsWithSceneCounts(projects, [
      scene({ id: 'a' }),
      scene({ id: 'b' }),
      scene({ id: 'c', platformProjectId: 'plx-other' }),
    ])
    expect(enriched[0]?.compositionCount).toBe(2)
  })
})
