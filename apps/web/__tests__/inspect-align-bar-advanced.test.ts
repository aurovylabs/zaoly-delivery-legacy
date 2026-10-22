import { describe, expect, it } from 'vitest'
import {
  inspectAlignDistributeMode,
  nextInspectAlignDistributeJc,
} from '../components/inspect-align-bar'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '../../..')

describe('InspectAlignBar advanced values', () => {
  it('cycles distribute jc Packed → Between → Around → Packed', () => {
    expect(inspectAlignDistributeMode('flex-start')).toBe('packed')
    expect(nextInspectAlignDistributeJc('packed')).toBe('space-between')
    expect(inspectAlignDistributeMode('space-between')).toBe('even')
    expect(nextInspectAlignDistributeJc('even')).toBe('space-around')
    expect(inspectAlignDistributeMode('space-around')).toBe('around')
    expect(nextInspectAlignDistributeJc('around')).toBe('flex-start')
  })

  it('locales pin section titles + stretch/around labels', () => {
    const en = JSON.parse(
      readFileSync(path.join(repoRoot, 'apps/web/locales/en.json'), 'utf8'),
    ) as { editor: Record<string, string> }
    const de = JSON.parse(
      readFileSync(path.join(repoRoot, 'apps/web/locales/de.json'), 'utf8'),
    ) as { editor: Record<string, string> }
    for (const key of [
      'inspectSectionComponent',
      'inspectSectionConstraints',
      'inspectSectionAppearance',
      'inspectSectionTypography',
      'inspectMediaGroup',
      'inspectPositionGroup',
      'inspectDistributeAround',
      'inspectAlignStretch',
      'inspectPromoteCurrentColor',
    ]) {
      expect(en.editor[key], key).toBeTruthy()
      expect(de.editor[key], key).toBeTruthy()
    }
  })
})
