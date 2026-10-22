import { describe, expect, it } from 'vitest'
import {
  applyAssetDigital,
  applyDigitalScalar,
  applyEffectDigital,
  applyGlowDigital,
  applyMotionDigital,
  applyShadowDigital,
  applyTypographyDigital,
  buildAssetValue,
  buildEffectValue,
  buildGlowValue,
  buildMotionValue,
  buildShadowValue,
  buildTypographyValue,
  isPromotableLiteral,
  isStudioPackWritableType,
  isStudioEditableType,
  isValidStudioTokenPath,
  readAssetSummary,
  readDigitalScalar,
  readEffectSummary,
  readGlowSummary,
  readMotionSummary,
  readShadowSummary,
  readTypographySummary,
  studioTypeForInspectGroup,
  suggestPromoteTokenPath,
} from '../lib/inspect/digital-edit'

describe('digital-edit (P75 / P82a / CT-20)', () => {
  it('marks color/spacing/radius/opacity/size/typography/shadow/asset editable', () => {
    expect(isStudioEditableType('color')).toBe(true)
    expect(isStudioEditableType('spacing')).toBe(true)
    expect(isStudioEditableType('typography')).toBe(true)
    expect(isStudioEditableType('shadow')).toBe(true)
    expect(isStudioEditableType('asset')).toBe(true)
    expect(isStudioEditableType('glow')).toBe(true)
    expect(isStudioEditableType('effect')).toBe(true)
    expect(isStudioEditableType('motion')).toBe(true)
    expect(isStudioPackWritableType('glow')).toBe(false)
    expect(isStudioPackWritableType('motion')).toBe(false)
    expect(isStudioPackWritableType('color')).toBe(true)
  })

  it('P81a/P82a/CT-20 validates studio token paths against type roots', () => {
    expect(isValidStudioTokenPath('color.action.secondary', 'color')).toBe(true)
    expect(isValidStudioTokenPath('spacing.static.xl', 'spacing')).toBe(true)
    expect(isValidStudioTokenPath('typography.heading.h2', 'typography')).toBe(true)
    expect(isValidStudioTokenPath('shadow.elevation.md', 'shadow')).toBe(true)
    expect(isValidStudioTokenPath('glow.accent', 'glow')).toBe(true)
    expect(isStudioEditableType('artboard')).toBe(true)
    expect(isValidStudioTokenPath('artboard.preset.desktop', 'artboard')).toBe(true)
    expect(isStudioPackWritableType('artboard')).toBe(false)
    expect(isValidStudioTokenPath('effect.blur.md', 'effect')).toBe(true)
    expect(isValidStudioTokenPath('motion.base', 'motion')).toBe(true)
    expect(isValidStudioTokenPath('asset.hero', 'asset')).toBe(true)
    expect(isValidStudioTokenPath('color.primary', 'asset')).toBe(false)
    expect(isValidStudioTokenPath('spacing.static.xl', 'color')).toBe(false)
    expect(isValidStudioTokenPath('color', 'color')).toBe(false)
  })

  it('CT-18 maps inspect groups and suggests promote paths', () => {
    expect(studioTypeForInspectGroup('space')).toBe('spacing')
    expect(studioTypeForInspectGroup('radius')).toBe('radius')
    expect(studioTypeForInspectGroup('fontFamily')).toBeNull()
    expect(isPromotableLiteral('radius', '12px')).toBe(true)
    expect(isPromotableLiteral('radius', 'nope')).toBe(false)
    expect(isPromotableLiteral('color', '#0a0a0a')).toBe(true)
    expect(isPromotableLiteral('color', '#0a0a0a88')).toBe(true)
    expect(suggestPromoteTokenPath('radius', '12px')).toBe('radius.custom.12px')
    expect(suggestPromoteTokenPath('color', '#FFAA00')).toBe('color.custom.ffaa00')
  })

  it('builds typography Add values (P82a)', () => {
    const next = buildTypographyValue({
      family: 'Source Serif 4',
      weight: '600',
      digitalSize: '2rem',
      lineHeight: '1.2',
    })
    expect(next).toBeTruthy()
    const parsed = JSON.parse(next!) as {
      family: string
      weight: string
      digital: { size: string; lineHeight: string }
    }
    expect(parsed.family).toBe('Source Serif 4')
    expect(parsed.weight).toBe('600')
    expect(parsed.digital.size).toBe('2rem')
    expect(parsed.digital.lineHeight).toBe('1.2')
    expect(readTypographySummary(next)).toContain('Source Serif 4')
    expect(
      buildTypographyValue({ family: '', weight: '400', digitalSize: '1rem', lineHeight: '' }),
    ).toBeNull()
  })

  it('CT-20 applies typography digital edit while preserving print', () => {
    const value = JSON.stringify({
      family: 'Geist',
      weight: '400',
      digital: { size: '1rem' },
      print: { size: '10pt' },
    })
    const next = applyTypographyDigital(value, {
      family: 'Source Serif 4',
      weight: '600',
      digitalSize: '2rem',
      lineHeight: '1.35',
    })
    expect(next).toBeTruthy()
    const parsed = JSON.parse(next!) as {
      family: string
      weight: string
      digital: { size: string; lineHeight: string; weight: string }
      print: { size: string }
    }
    expect(parsed.family).toBe('Source Serif 4')
    expect(parsed.digital.size).toBe('2rem')
    expect(parsed.digital.lineHeight).toBe('1.35')
    expect(parsed.print.size).toBe('10pt')
  })

  it('CT-20 builds and edits shadow digital values', () => {
    const created = buildShadowValue({
      offsetX: '0',
      offsetY: '8px',
      blur: '16px',
      spread: '0',
      color: 'rgba(0,0,0,0.2)',
      inset: false,
    })
    expect(created).toBeTruthy()
    expect(readShadowSummary(created)).toContain('8px')
    const next = applyShadowDigital(created, {
      offsetX: '2px',
      offsetY: '4px',
      blur: '12px',
      spread: '1px',
      color: '#00000033',
      inset: true,
    })
    const parsed = JSON.parse(next!) as {
      digital: { offsetY: string; inset: boolean; color: string }
    }
    expect(parsed.digital.offsetY).toBe('4px')
    expect(parsed.digital.inset).toBe(true)
    expect(parsed.digital.color).toBe('#00000033')
  })

  it('builds glow and effect local pack values', () => {
    const glow = buildGlowValue({ color: '#1f44ff', blur: '24px', spread: '2px' })
    expect(glow).toBeTruthy()
    expect(readGlowSummary(glow)).toContain('24px')
    const nextGlow = applyGlowDigital(glow, {
      offsetX: '4px',
      offsetY: '-2px',
      color: '#c6f24a',
      blur: '16px',
      spread: '0',
    })
    expect(JSON.parse(nextGlow!).digital.color).toBe('#c6f24a')
    expect(JSON.parse(nextGlow!).digital.offsetX).toBe('4px')
    expect(JSON.parse(nextGlow!).digital.offsetY).toBe('-2px')
    const effect = buildEffectValue({ kind: 'blur', amount: '8px' })
    expect(readEffectSummary(effect)).toBe('blur(8px)')
    expect(buildEffectValue({ kind: 'blur', amount: '' })).toBeNull()
    const motion = buildMotionValue({
      duration: '240ms',
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    })
    expect(readMotionSummary(motion)).toContain('240ms')
    const nextMotion = applyMotionDigital(motion, {
      duration: '120ms',
      easing: 'ease-out',
    })
    expect(JSON.parse(nextMotion!).digital.duration).toBe('120ms')
  })

  it('CT-20 builds and edits asset URI-ref values', () => {
    const created = buildAssetValue({
      label: 'Primary mark',
      src: 'https://cdn.example/logo.svg',
      format: 'svg',
      minWidth: '120px',
    })
    expect(created).toBeTruthy()
    expect(readAssetSummary(created)).toContain('Primary mark')
    const next = applyAssetDigital(created, {
      label: 'Wordmark',
      src: 'https://cdn.example/wordmark.svg',
      format: 'svg',
      minWidth: '',
    })
    const parsed = JSON.parse(next!) as {
      label: string
      digital: { src: string; format: string; minWidth?: string }
    }
    expect(parsed.label).toBe('Wordmark')
    expect(parsed.digital.src).toBe('https://cdn.example/wordmark.svg')
    expect(parsed.digital.minWidth).toBeUndefined()
  })

  it('reads and applies color digital hex while preserving print', () => {
    const value = JSON.stringify({
      digital: { hex: '#00ca55' },
      print: { pantone: 'PMS 354 C' },
    })
    expect(readDigitalScalar('color', value)).toBe('#00ca55')
    const next = applyDigitalScalar('color', value, '#112233')
    expect(next).toBeTruthy()
    const parsed = JSON.parse(next!) as {
      digital: { hex: string }
      print: { pantone: string }
    }
    expect(parsed.digital.hex).toBe('#112233')
    expect(parsed.print.pantone).toBe('PMS 354 C')
  })

  it('rejects invalid color and applies spacing length', () => {
    expect(applyDigitalScalar('color', { digital: { hex: '#fff' } }, 'not-a-hex')).toBeNull()
    const next = applyDigitalScalar(
      'spacing',
      { digital: '0.5rem', print: '2mm' },
      '1.25rem',
    )
    expect(JSON.parse(next!).digital).toBe('1.25rem')
    expect(JSON.parse(next!).print).toBe('2mm')
  })

  it('stores rgba / oklch digital css while keeping a picker hex', () => {
    const rgba = applyDigitalScalar('color', { digital: { hex: '#1f44ff' } }, 'rgba(31, 68, 255, 0.5)')
    expect(rgba).toBeTruthy()
    const parsed = JSON.parse(rgba!) as { digital: { css: string; hex: string } }
    expect(parsed.digital.css).toBe('rgba(31, 68, 255, 0.5)')
    expect(parsed.digital.hex).toBe('#1f44ff')
    expect(readDigitalScalar('color', rgba)).toBe('rgba(31, 68, 255, 0.5)')
    const oklch = applyDigitalScalar('color', rgba, 'oklch(0.51 0.27 266)')
    expect(JSON.parse(oklch!).digital.css).toBe('oklch(0.51 0.27 266)')
  })

  it('applies size preferred when present', () => {
    const value = { digital: { min: '24px', preferred: '48px' } }
    expect(readDigitalScalar('size', value)).toBe('48px')
    const next = applyDigitalScalar('size', value, '52px')
    expect(JSON.parse(next!).digital.preferred).toBe('52px')
    expect(JSON.parse(next!).digital.min).toBe('24px')
  })

  it('does not treat typography as scalar edit', () => {
    expect(applyDigitalScalar('typography', {}, '1rem')).toBeNull()
    expect(readDigitalScalar('typography', { family: 'Geist' })).toBeNull()
  })
})
