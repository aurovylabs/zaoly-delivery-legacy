import { describe, expect, it } from 'vitest'
import {
  isFillSize,
  isMediaPaintNodeType,
  mediaNodeHostStyle,
  resolveMediaPaintElement,
} from '../lib/editor/media-node-host-style'

describe('mediaNodeHostStyle', () => {
  it('recognizes SiteImage / SiteSvg only', () => {
    expect(isMediaPaintNodeType('SiteImage')).toBe(true)
    expect(isMediaPaintNodeType('SiteSvg')).toBe(true)
    expect(isMediaPaintNodeType('SiteText')).toBe(false)
  })

  it('resolveMediaPaintElement returns the img for SiteImage hosts', () => {
    const host = document.createElement('div')
    host.setAttribute('data-node-type', 'SiteImage')
    const img = document.createElement('img')
    img.className = 'site-img'
    host.appendChild(img)
    expect(resolveMediaPaintElement(host)).toBe(img)
  })

  it('resolveMediaPaintElement ignores non-media hosts', () => {
    const host = document.createElement('div')
    host.setAttribute('data-node-type', 'Stack')
    const img = document.createElement('img')
    img.className = 'site-img'
    host.appendChild(img)
    expect(resolveMediaPaintElement(host)).toBeNull()
  })

  it('hugs when width is unset', () => {
    expect(mediaNodeHostStyle('SiteImage', undefined)).toEqual({
      width: 'max-content',
      maxWidth: '100%',
      alignSelf: 'flex-start',
    })
  })

  it('fills when width is 100% or fill', () => {
    expect(isFillSize('100%')).toBe(true)
    expect(isFillSize('fill')).toBe(true)
    expect(mediaNodeHostStyle('SiteImage', '100%')).toEqual({
      width: '100%',
      maxWidth: '100%',
      alignSelf: 'stretch',
    })
  })

  it('hugs fixed widths on the host (size still paints on the img)', () => {
    expect(mediaNodeHostStyle('SiteSvg', '320px')).toMatchObject({
      width: 'max-content',
      alignSelf: 'flex-start',
    })
  })

  it('returns undefined for non-media types', () => {
    expect(mediaNodeHostStyle('Stack', '100%')).toBeUndefined()
  })
})
