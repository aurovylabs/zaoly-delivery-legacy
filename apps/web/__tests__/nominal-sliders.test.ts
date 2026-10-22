import { describe, expect, it } from 'vitest'
import {
  effectAmountLadder,
  formatNominal,
  ladderIndexFromNumber,
  msLadder,
  numberFromLadderIndex,
  numberFromSliderValue,
  parseCssNumber,
  remLadder,
  signedPxLadder,
  sliderValueFromNumber,
  snapCssToLadder,
  snapToLadder,
  wrapLadderIndex,
} from '../lib/tokens/nominal-sliders'

describe('nominal-sliders', () => {
  it('snaps rem lengths to the ladder', () => {
    const ladder = remLadder()
    expect(snapToLadder(0.9, ladder)).toBe(1)
    expect(snapCssToLadder('0.9rem', ladder)).toBe('1rem')
    expect(formatNominal(0.25, 'rem')).toBe('0.25rem')
  })

  it('maps discrete slider indices to ladder values', () => {
    const ladder = msLadder()
    expect(numberFromSliderValue(0, ladder)).toBe(80)
    expect(numberFromSliderValue(4, ladder)).toBe(240)
    expect(sliderValueFromNumber(230, ladder)).toBe(4)
    expect(snapCssToLadder('0.24s', ladder)).toBe('240ms')
  })

  it('parses css numbers and effect amount ladders', () => {
    expect(parseCssNumber('12px')).toEqual({ value: 12, unit: 'px' })
    expect(effectAmountLadder('blur').unit).toBe('px')
    expect(effectAmountLadder('saturate').unit).toBe('ratio')
    expect(snapToLadder(1.58, effectAmountLadder('saturate'))).toBe(1.6)
    expect(snapToLadder(1.52, effectAmountLadder('saturate'))).toBe(1.5)
  })

  it('extends endless wheel indices past catalog ends (no wrap-to-zero)', () => {
    const ladder = remLadder()
    const last = ladder.values[ladder.values.length - 1]!
    expect(last).toBe(8)
    expect(numberFromLadderIndex(ladder.values.length, ladder)).toBe(10)
    expect(numberFromLadderIndex(ladder.values.length + 1, ladder)).toBe(12)
    expect(ladderIndexFromNumber(10, ladder)).toBe(ladder.values.length)
    expect(numberFromLadderIndex(-1, ladder)).toBe(0)
    expect(wrapLadderIndex(-1, ladder.values.length)).toBe(ladder.values.length - 1)
  })

  it('extends signed offset ladders below zero', () => {
    const ladder = signedPxLadder()
    expect(ladder.floorAtZero).toBe(false)
    expect(numberFromLadderIndex(ladderIndexFromNumber(-8, ladder) - 1, ladder)).toBe(-12)
    expect(formatNominal(-4, 'px')).toBe('-4px')
  })
})
