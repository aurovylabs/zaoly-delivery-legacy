import { describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { auditSceneContent } from '../lib/scene/scene-content-audit'

function seedPdpScene(): CompositionScene {
  return {
    id: 'scene-audit-seed',
    name: 'Seed PDP',
    version: 1,
    updatedAt: '2026-08-24T12:00:00.000Z',
    root: {
      id: 'root',
      type: 'SiteStack',
      children: [
        {
          id: 'title',
          type: 'SiteText',
          props: { role: 'title', children: 'Text' },
        },
        {
          id: 'cta',
          type: 'SiteButton',
          props: { children: 'Get started' },
        },
        {
          id: 'size',
          type: 'SiteSelect',
          props: { placeholder: 'Select', options: 'Option A\nOption B' },
        },
        {
          id: 'hero',
          type: 'SiteImage',
          props: { alt: 'Image', src: 'https://example.com/x.png' },
        },
      ],
    },
  }
}

function filledPdpScene(): CompositionScene {
  return {
    id: 'scene-audit-ok',
    name: 'Filled PDP',
    version: 1,
    updatedAt: '2026-08-24T12:00:00.000Z',
    root: {
      id: 'root',
      type: 'SiteStack',
      children: [
        {
          id: 'title',
          type: 'SiteText',
          props: { role: 'title', children: 'Urban Glide E-Bike' },
        },
        {
          id: 'price',
          type: 'SiteText',
          props: { role: 'body', children: '2.999 €' },
        },
        {
          id: 'cta',
          type: 'SiteButton',
          props: { children: 'In den Warenkorb' },
        },
        {
          id: 'size',
          type: 'SiteSelect',
          props: { placeholder: 'Rahmengröße', options: 'S\nM\nL\nXL' },
        },
        {
          id: 'hero',
          type: 'SiteImage',
          props: { alt: 'E-Bike Seitenansicht', src: 'https://example.com/bike.png' },
        },
      ],
    },
  }
}

describe('auditSceneContent', () => {
  it('flags seed copy, select options, CTA, and generic alt on fixture', () => {
    const result = auditSceneContent(seedPdpScene())
    expect(result.ok).toBe(false)
    const codes = result.findings.map((f) => f.code)
    expect(codes).toContain('seed-copy')
    expect(codes).toContain('empty-select-options')
    expect(codes).toContain('missing-cta')
    expect(codes).toContain('generic-alt')
  })

  it('returns ok for content-complete PDP fixture', () => {
    const result = auditSceneContent(filledPdpScene())
    expect(result.ok).toBe(true)
    expect(result.findings.filter((f) => f.severity === 'error')).toHaveLength(0)
  })
})
