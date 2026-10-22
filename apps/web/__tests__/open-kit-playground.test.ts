import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { openKitPlaygroundHref } from '../lib/site-kit/open-kit-playground'

describe('openKitPlaygroundHref', () => {
  const open = vi.fn()

  beforeEach(() => {
    open.mockReset()
    open.mockReturnValue({ closed: false })
    vi.stubGlobal('window', { open })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens relative Kit href in a new tab', () => {
    expect(
      openKitPlaygroundHref('/kit?componentId=Composition~demo&platformProjectId=col-1'),
    ).toBe(true)
    expect(open).toHaveBeenCalledWith(
      '/kit?componentId=Composition~demo&platformProjectId=col-1',
      '_blank',
      'noopener,noreferrer',
    )
  })

  it('rejects non-relative hrefs', () => {
    expect(openKitPlaygroundHref('https://evil.example/kit')).toBe(false)
    expect(open).not.toHaveBeenCalled()
  })

  it('returns false when window.open is blocked', () => {
    open.mockReturnValue(null)
    expect(openKitPlaygroundHref('/kit?componentId=x')).toBe(false)
  })
})
