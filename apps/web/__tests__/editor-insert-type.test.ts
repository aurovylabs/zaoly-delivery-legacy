import { describe, expect, it, beforeEach } from 'vitest'
import {
  __resetAppliedEditorInsertKeysForTests,
  claimEditorInsertOnce,
  editorInsertAppliedKey,
  stripEditorInsertTypeFromUrl,
} from '../lib/editor-insert-once'
import { buildEditorLaunchUrl, EDITOR_HINT_QUERY_PARAM, editorHref } from '../lib/editor-launch'
import { paths } from '../lib/paths'

describe('editor insertType once (SK-V7)', () => {
  beforeEach(() => {
    __resetAppliedEditorInsertKeysForTests()
  })

  it('claims insert once per scene+type', () => {
    expect(claimEditorInsertOnce('scene-a', 'SiteButton')).toBe(true)
    expect(claimEditorInsertOnce('scene-a', 'SiteButton')).toBe(false)
    expect(claimEditorInsertOnce('scene-a', 'SiteText')).toBe(true)
    expect(claimEditorInsertOnce('scene-b', 'SiteButton')).toBe(true)
    expect(editorInsertAppliedKey('scene-a', 'SiteButton')).toBe('scene-a::SiteButton')
  })

  it('strips insertType from relative and absolute URLs', () => {
    expect(stripEditorInsertTypeFromUrl('/editor?insertType=SiteButton&platformProjectId=c1')).toBe(
      '/editor?platformProjectId=c1',
    )
    expect(
      stripEditorInsertTypeFromUrl('https://example.test/editor?insertType=SiteButton'),
    ).toContain('/editor')
    expect(
      stripEditorInsertTypeFromUrl('https://example.test/editor?insertType=SiteButton'),
    ).not.toContain('insertType=')
  })

  it('builds editorHref with save-pattern hint', () => {
    const href = editorHref({
      platformProjectId: 'col-1',
      hint: paths.editorHintSavePattern,
    })
    expect(href).toContain(`${EDITOR_HINT_QUERY_PARAM}=${paths.editorHintSavePattern}`)
    expect(href).toContain('platformProjectId=col-1')
    expect(buildEditorLaunchUrl('/editor', { hint: 'save-pattern' })).toContain('hint=save-pattern')
  })
})
