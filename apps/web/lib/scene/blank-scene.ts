import type { CompositionScene } from '@zaoly/contracts'
import { createSceneNodeId, defaultChildForType } from './ops'

/**
 * Minimal valid CompositionScene for hub / project-detail create.
 * Upsert via POST `/api/scenes` — pages materialize in `prepareScene`.
 * Standalone: `platformProjectId` optional; `ownerUserId` stamped by API.
 */
export function createBlankScene(input: {
  name: string
  platformProjectId?: string | null
  ownerUserId?: string | null
  id?: string
}): CompositionScene {
  const name = input.name.trim() || 'Untitled'
  const platformProjectId = input.platformProjectId?.trim() || null
  const ownerUserId = input.ownerUserId?.trim() || null
  const root = defaultChildForType('SiteStack')
  root.name = 'Page'
  return {
    id: input.id ?? createSceneNodeId('scene'),
    name,
    version: 1,
    ...(platformProjectId ? { platformProjectId } : { platformProjectId: null }),
    ...(ownerUserId ? { ownerUserId } : {}),
    activeBreakpoint: 'desktop',
    root,
    updatedAt: new Date().toISOString(),
  }
}
