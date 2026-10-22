import { describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import {
  addSceneComment,
  commentsForNode,
  pruneOrphanComments,
  setCommentResolved,
} from '../lib/scene-comments'

const scene: CompositionScene = {
  id: 's1',
  name: 'Demo',
  version: 1,
  updatedAt: new Date().toISOString(),
  root: {
    id: 'root',
    type: 'Stack',
    children: [{ id: 'n1', type: 'Text', name: 'Title' }],
  },
}

describe('scene-comments (P82b)', () => {
  it('adds a comment on an existing node', () => {
    const next = addSceneComment(scene, { nodeId: 'n1', body: 'Tighten leading' })
    expect(next).toBeTruthy()
    expect(next!.comments).toHaveLength(1)
    expect(next!.comments![0].body).toBe('Tighten leading')
    expect(next!.comments![0].resolved).toBe(false)
  })

  it('rejects comments on missing nodes', () => {
    expect(addSceneComment(scene, { nodeId: 'gone', body: 'x' })).toBeNull()
  })

  it('prunes orphans and resolves', () => {
    const withCmt = addSceneComment(scene, { nodeId: 'n1', body: 'ok' })!
    const pruned = pruneOrphanComments(
      [
        ...withCmt.comments!,
        {
          id: 'orphan',
          nodeId: 'missing',
          body: 'gone',
          author: 'x',
          createdAt: new Date().toISOString(),
          resolved: false,
        },
      ],
      scene.root,
    )
    expect(pruned).toHaveLength(1)
    const resolved = setCommentResolved(withCmt, withCmt.comments![0].id, true)
    expect(resolved.comments![0].resolved).toBe(true)
    expect(commentsForNode(resolved.comments, 'n1')).toHaveLength(1)
  })
})
