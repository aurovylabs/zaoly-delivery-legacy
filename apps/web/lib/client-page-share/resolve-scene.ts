/**
 * Resolve the CompositionScene used for public Client Share render.
 * live_head → current scene subset; pinned → stored snapshot.
 */
import type { CompositionScene } from '@zaoly/contracts'
import { getScene } from '../scene/scene-store'
import {
  buildClientShareSnapshot,
  sceneFromClientShareSnapshot,
  type ClientShareSnapshot,
} from './snapshot'
import type { ClientPageShareRecord } from './store'

export async function resolveClientShareRenderScene(
  record: ClientPageShareRecord,
): Promise<{
  scene: CompositionScene
  contentMode: ClientPageShareRecord['contentMode']
  snapshot: ClientShareSnapshot
  draft: boolean
}> {
  if (record.contentMode === 'live_head') {
    const live = await getScene(record.sceneId)
    if (live) {
      const built = buildClientShareSnapshot(live, record.pageIds)
      if (built.ok) {
        return {
          scene: sceneFromClientShareSnapshot(built.snapshot),
          contentMode: 'live_head',
          snapshot: built.snapshot,
          draft: true,
        }
      }
    }
  }

  return {
    scene: sceneFromClientShareSnapshot(record.snapshot),
    contentMode: record.contentMode,
    snapshot: record.snapshot,
    draft: record.contentMode === 'live_head',
  }
}
