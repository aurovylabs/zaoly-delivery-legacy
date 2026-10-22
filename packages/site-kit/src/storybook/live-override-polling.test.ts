import { describe, expect, it } from 'vitest'
import {
  initialOverrideFetchState,
  reduceOverrideFetch,
} from './live-override-polling'

describe('live override polling state', () => {
  it('resets to loading with no override on component change', () => {
    const prev = reduceOverrideFetch(initialOverrideFetchState(), {
      type: 'success',
      override: { composition: { type: 'SiteButton', props: {} } },
    })
    const next = reduceOverrideFetch(prev, { type: 'reset' })
    expect(next).toEqual({ status: 'loading', override: null })
  })

  it('clears tree on not-found instead of keeping prior override', () => {
    const prev = reduceOverrideFetch(initialOverrideFetchState(), {
      type: 'success',
      override: { composition: { type: 'SiteButton', props: {} } },
    })
    const next = reduceOverrideFetch(prev, { type: 'not-found' })
    expect(next.status).toBe('not-found')
    expect(next.override).toBeNull()
  })

  it('marks transient poll errors as stale when a tree was loaded', () => {
    const prev = reduceOverrideFetch(initialOverrideFetchState(), {
      type: 'success',
      override: { composition: { type: 'SiteText', props: { children: 'A' } } },
    })
    const next = reduceOverrideFetch(prev, { type: 'error' })
    expect(next.status).toBe('stale')
    expect(next.override).toEqual(prev.override)
  })

  it('reports error when the first fetch fails', () => {
    const next = reduceOverrideFetch(initialOverrideFetchState(), { type: 'error' })
    expect(next.status).toBe('error')
    expect(next.override).toBeNull()
  })
})
