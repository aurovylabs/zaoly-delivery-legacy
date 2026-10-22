import { describe, expect, it } from 'vitest'
import {
  appendLinePoint,
  closeActivePath,
  emptyVectorDraft,
  parsePathD,
  parsePathsFromSvgMarkup,
  serializeDraftToPathD,
  serializeDraftToSvgMarkup,
} from '../lib/vector'

const TRIANGLE_D = 'M16 30 L24 14 L32 30 Z'
const TRIANGLE_MARKUP =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-hidden="true"><path d="M16 30 L24 14 L32 30 Z" fill="currentColor"/></svg>'

describe('vector draft Phase 4', () => {
  it('round-trips a simple triangle path via markup', () => {
    const draft = parsePathsFromSvgMarkup(TRIANGLE_MARKUP)
    expect(draft).not.toBeNull()
    expect(draft!.viewBox).toBe('0 0 48 48')
    expect(draft!.paths).toHaveLength(1)
    expect(draft!.paths[0]!.commands).toEqual([
      { type: 'M', x: 16, y: 30 },
      { type: 'L', x: 24, y: 14 },
      { type: 'L', x: 32, y: 30 },
      { type: 'Z' },
    ])

    const d = serializeDraftToPathD(draft!)
    expect(d).toBe(TRIANGLE_D)

    const markup = serializeDraftToSvgMarkup(draft!)
    expect(markup).toContain('viewBox="0 0 48 48"')
    expect(markup).toContain(`d="${TRIANGLE_D}"`)

    const again = parsePathsFromSvgMarkup(markup)
    expect(serializeDraftToPathD(again!)).toBe(TRIANGLE_D)
  })

  it('parses path d alone and serializes back', () => {
    const commands = parsePathD(TRIANGLE_D)
    expect(commands).toEqual([
      { type: 'M', x: 16, y: 30 },
      { type: 'L', x: 24, y: 14 },
      { type: 'L', x: 32, y: 30 },
      { type: 'Z' },
    ])
    expect(
      serializeDraftToPathD({ paths: [{ commands: commands! }] }),
    ).toBe(TRIANGLE_D)
  })

  it('returns null for unparseable / pathless craft', () => {
    expect(parsePathsFromSvgMarkup('')).toBeNull()
    expect(parsePathsFromSvgMarkup('<svg><circle cx="10" cy="10" r="5"/></svg>')).toBeNull()
    expect(parsePathsFromSvgMarkup('<svg><path d="Q1 2 3 4"/></svg>')).toBeNull()
    expect(parsePathsFromSvgMarkup('<svg><path d="M10 24 H32"/></svg>')).toBeNull()
  })

  it('supports click-to-line draw helpers then close', () => {
    let draft = emptyVectorDraft('0 0 48 48')
    draft = appendLinePoint(draft, { x: 16, y: 30 })
    draft = appendLinePoint(draft, { x: 24, y: 14 })
    draft = appendLinePoint(draft, { x: 32, y: 30 })
    draft = closeActivePath(draft)
    expect(serializeDraftToPathD(draft)).toBe(TRIANGLE_D)
  })
})
