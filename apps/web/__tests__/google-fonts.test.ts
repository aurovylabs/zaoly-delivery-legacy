import { describe, expect, it } from 'vitest'
import { collectSceneFontFamilies } from '../lib/fonts/collect-scene-font-families'
import {
  GOOGLE_FONT_FAMILIES,
  GOOGLE_FONT_PICKER_OPTIONS,
  GOOGLE_FONT_POPULAR,
} from '../lib/fonts/google-font-catalog'
import {
  googleFontFamilyName,
  googleFontLiteralPath,
  googleFontsStylesheetHref,
  parseGoogleFontLiteralPath,
} from '../lib/fonts/google-fonts'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'
import type { SceneNode } from '@zaoly/contracts'

describe('google fonts helpers', () => {
  it('aliases Geist to Inter and builds CSS2 href via paths base', () => {
    expect(googleFontFamilyName('Geist')).toBe('Inter')
    expect(googleFontsStylesheetHref('Geist')).toContain('fonts.googleapis.com/css2')
    expect(googleFontsStylesheetHref('Geist')).toContain('family=Inter')
    expect(googleFontFamilyName('system-ui')).toBeNull()
  })

  it('encodes Google Font literal paths for TokenPicker', () => {
    expect(googleFontLiteralPath('Roboto')).toBe('gf:Roboto')
    expect(parseGoogleFontLiteralPath('gf:Source Serif 4')).toBe('Source Serif 4')
    expect(parseGoogleFontLiteralPath('typography.body.family')).toBeNull()
  })

  it('ships a full Google Fonts family snapshot with popular first in picker options', () => {
    expect(GOOGLE_FONT_FAMILIES.length).toBeGreaterThan(1500)
    expect(GOOGLE_FONT_FAMILIES).toContain('Inter')
    expect(GOOGLE_FONT_PICKER_OPTIONS[0]?.label).toBe(GOOGLE_FONT_POPULAR[0])
    expect(GOOGLE_FONT_PICKER_OPTIONS.some((o) => o.category === 'google')).toBe(true)
  })
})

describe('collectSceneFontFamilies', () => {
  it('collects literal and resolved Brandion typography families', () => {
    const root: SceneNode = {
      id: 'root',
      type: 'Frame',
      name: 'Root',
      props: {},
      children: [
        {
          id: 't1',
          type: 'Text',
          name: 'A',
          props: { fontFamily: 'Roboto' },
          children: [],
        },
        {
          id: 't2',
          type: 'Heading',
          name: 'B',
          props: {},
          tokenBindings: { fontFamily: 'typography.heading.h1' },
          children: [],
        },
      ],
    }
    const families = collectSceneFontFamilies(root, INSPECT_TOKEN_CATALOG)
    expect(families).toEqual(expect.arrayContaining(['Roboto', 'Inter']))
  })
})
