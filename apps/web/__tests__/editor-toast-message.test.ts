import { describe, expect, it } from 'vitest'
import { editorToastMessage } from '../lib/editor-toast-message'

describe('editorToastMessage', () => {
  it('maps forbidden to a short ACL message', () => {
    expect(editorToastMessage('forbidden')).toBe(
      'You do not have edit access to this scene.',
    )
  })

  it('never surfaces Storyblok pack JSON', () => {
    const pack = JSON.stringify({
      meta: { generator: 'zaoly-storyblok-poc' },
      components: [{ name: 'creation_page' }],
    })
    expect(editorToastMessage(pack)).toBe(
      'Storyblok handoff is not available on this host.',
    )
    expect(editorToastMessage(pack).length).toBeLessThan(80)
  })

  it('truncates long messages', () => {
    const long = 'x'.repeat(500)
    expect(editorToastMessage(long).endsWith('…')).toBe(true)
    expect(editorToastMessage(long).length).toBeLessThanOrEqual(241)
  })
})
