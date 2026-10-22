import { describe, expect, it } from 'vitest'
import React from 'react'
import { Document, renderToBuffer } from '@react-pdf/renderer'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as PrintPrimitives from '../print/PrintPrimitives'
import { printMagColors } from '../print/tokens'
import { PRINT_MAG_TWINS } from '../magazine/twins'
import * as Mag from './index'
import { MagChip, MagChipRow } from './MagChip'
import { MagCallout } from './MagCallout'
import { MagSteps } from './MagSteps'
import { MagCover } from './MagCover'
import { MagPage } from './MagPage'
import { MagRankedList } from './MagRankedList'
import { MagTable } from './MagTable'
import { MagThemeProvider, applyMagTheme, getMagTheme } from './MagTheme'
import { magColors, createMagStyles } from './tokens'
import { mergeMagazineColors } from '../magazine/colors'
import {
  magazineLayoutDefaults,
  magazineTheme,
  magazineThemeToCssVars,
} from '../magazine/theme'
import { registerMagazinePdfFonts, registerMagazinePdfFontFromSrc } from './register-mag-fonts'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('Print↔Mag color twin equality', () => {
  it('printMagColors and magColors share the same keys and values', () => {
    expect(Object.keys(printMagColors).sort()).toEqual(Object.keys(magColors).sort())
    for (const key of Object.keys(printMagColors) as (keyof typeof printMagColors)[]) {
      expect(magColors[key]).toEqual(printMagColors[key])
    }
  })
})

describe('Print↔Mag structural twin map', () => {
  it('every twin has Mag export + Print primitive + Print story/mdx files', () => {
    for (const twin of PRINT_MAG_TWINS) {
      expect(Mag[twin.magExport as keyof typeof Mag], `missing Mag ${twin.magExport}`).toBeTypeOf(
        'function',
      )
      if (twin.printExport) {
        expect(
          PrintPrimitives[twin.printExport as keyof typeof PrintPrimitives],
          `missing Print ${twin.printExport}`,
        ).toBeTypeOf('function')
      }
      const stories = join(srcRoot, 'print', `Print${twin.printStory}.stories.tsx`)
      const mdx = join(srcRoot, 'print', `Print${twin.printStory}.mdx`)
      expect(existsSync(stories), stories).toBe(true)
      expect(existsSync(mdx), mdx).toBe(true)
    }
  })

  it('MagPage is exported for page chrome (logo/footer)', () => {
    expect(Mag.MagPage).toBeTypeOf('function')
    expect(Mag.MagThemeProvider).toBeTypeOf('function')
    expect(Mag.mergeMagazineColors).toBeTypeOf('function')
  })
})

describe('Mag theme override', () => {
  it('createMagStyles + mergeMagazineColors apply accent override', () => {
    const merged = mergeMagazineColors({ accent: '#ff00aa', paper: '#fff8f0' })
    expect(merged.accent).toBe('#ff00aa')
    expect(merged.paper).toBe('#fff8f0')
    expect(merged.ink).toBe(magColors.ink)
    const styles = createMagStyles(merged)
    expect(styles.page).toBeTruthy()
    expect(styles.accentRule).toBeTruthy()
  })

  it('applyMagTheme sets and resets active palette', () => {
    applyMagTheme({ accent: '#abcdef' })
    expect(getMagTheme().colors.accent).toBe('#abcdef')
    applyMagTheme(null)
    expect(getMagTheme().colors.accent).toBe(magColors.accent)
  })

  it('magazineTheme CSS vars match shared colors + 0.75 px→pt', () => {
    const vars = magazineThemeToCssVars(magazineTheme)
    expect(vars['--print-ink']).toBe(magColors.ink)
    expect(vars['--print-paper']).toBe(magColors.paper)
    expect(vars['--print-type-body']).toBe(magazineLayoutDefaults.typeBody)
    expect(magazineLayoutDefaults.cssPxToPdfPt).toBe(0.75)
    expect(magazineTheme.layout.columnMax).toBe('34rem')
  })
})

describe('Mag PDF kit smoke', () => {
  it('registers fonts and renders MagChip + MagCover to PDF', async () => {
    registerMagazinePdfFonts()
    const buffer = await renderToBuffer(
      <Document>
        <MagPage footerTitle="mag-kit-smoke">
          <MagChipRow>
            <MagChip>Smoke</MagChip>
            <MagChip tone="muted">muted</MagChip>
            <MagChip tone="accent">accent</MagChip>
            <MagChip tone="solid">solid</MagChip>
          </MagChipRow>
          <MagCallout variant="wash" label="Hinweis" body="Wash callout smoke." />
          <MagCallout variant="emphasize" body="Emphasize callout smoke." />
          <MagCallout variant="quiet" body="Quiet callout smoke." />
          <MagSteps
            emphasisIndex={2}
            steps={[
              { label: 'Audit' },
              { label: 'Cluster' },
              { label: 'Prioritize', detail: 'Rank' },
              { label: 'Ship' },
            ]}
          />
          <MagCover
            eyebrow="Quick Check"
            title="Magazin kit"
            kpis={[{ label: 'Score', value: '72', ringValue: 72, ringMax: 100 }]}
          />
        </MagPage>
      </Document>,
    )
    const pdf = Buffer.from(buffer)
    expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF')
    expect(pdf.length).toBeGreaterThan(500)
  }, 30000)

  it('renders with MagThemeProvider color override', async () => {
    registerMagazinePdfFonts()
    const buffer = await renderToBuffer(
      <Document>
        <MagThemeProvider colors={{ accent: '#1122aa', paper: '#f0f4ff' }}>
          <MagPage footerTitle="theme-smoke" showLogo={false}>
            <MagCover
              eyebrow="Themed"
              title="Brand accent"
              kpis={[{ label: 'A', value: '1', ringValue: 40, ringMax: 100 }]}
            />
          </MagPage>
        </MagThemeProvider>
      </Document>,
    )
    const pdf = Buffer.from(buffer)
    expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF')
  }, 30000)
  it('renders MagRankedList with instance tones (P84)', async () => {
    registerMagazinePdfFonts()
    const buffer = await renderToBuffer(
      <Document>
        <MagPage footerTitle="tones-smoke" showLogo={false}>
          <MagRankedList
            tones={{ ink: '#1122aa', accentInk: '#aa1122' }}
            labelStyle={{ fontSize: 14, textAlign: 'center' }}
            gap={12}
            items={[
              { label: 'Base tone' },
              { label: 'Per-item', color: '#00aa55', labelStyle: { fontSize: 16 } },
            ]}
          />
        </MagPage>
      </Document>,
    )
    const pdf = Buffer.from(buffer)
    expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF')
    expect(pdf.length).toBeGreaterThan(500)
  }, 30000)

  it('renders MagTable with cell textAlign (P90)', async () => {
    registerMagazinePdfFonts()
    const buffer = await renderToBuffer(
      <Document>
        <MagPage footerTitle="table-align-smoke" showLogo={false}>
          <MagTable
            columns={['Metric', 'Now']}
            rows={[['GEO', 72]]}
            headStyle={{ textAlign: 'center' }}
            cellStyle={{ textAlign: 'center', fontSize: 12 }}
            gap={10}
          />
          <MagTable
            columns={['Metric', 'Now', 'EUR']}
            columnAlign={['left', 'left', 'right']}
            rows={[['GEO', 72, '1.240']]}
          />
        </MagPage>
      </Document>,
    )
    const pdf = Buffer.from(buffer)
    expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF')
    expect(pdf.length).toBeGreaterThan(500)
  }, 30000)

  it('renders MagTable fit=hug with alignSelf flex-end without blowout (P91)', async () => {
    registerMagazinePdfFonts()
    const { View } = await import('@react-pdf/renderer')
    const buffer = await renderToBuffer(
      <Document>
        <MagPage footerTitle="table-hug-smoke" showLogo={false}>
          <View style={{ alignSelf: 'flex-end' }}>
            <MagTable fit="hug" columns={['Metric', 'Now']} rows={[['GEO', 72]]} />
          </View>
        </MagPage>
      </Document>,
    )
    const pdf = Buffer.from(buffer)
    expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF')
    expect(pdf.length).toBeGreaterThan(500)
  }, 30000)
})

describe('Mag PDF pixel smoke (P82d)', () => {
  it('registers custom font from local TTF path', () => {
    registerMagazinePdfFonts()
    const dir = join(dirname(fileURLToPath(import.meta.url)), 'fonts')
    const regular = join(dir, 'NotoSans-Regular.ttf')
    expect(existsSync(regular)).toBe(true)
    expect(registerMagazinePdfFontFromSrc('MagExtraFace', regular)).toBe(true)
    expect(registerMagazinePdfFontFromSrc('MagExtraFace', regular)).toBe(true)
  })

  it('renders MagCover PDF and converts page-1 to PNG via pdf-to-img', async () => {
    registerMagazinePdfFonts()
    const buffer = await renderToBuffer(
      <Document>
        <MagPage footerTitle="pixel-smoke" showLogo={false}>
          <MagCover
            eyebrow="Pixel"
            title="Magazin pixel smoke"
            kpis={[{ label: 'Score', value: '88', ringValue: 88, ringMax: 100 }]}
          />
        </MagPage>
      </Document>,
    )
    const pdf = Buffer.from(buffer)
    expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF')

    let pdfToImg: typeof import('pdf-to-img') | null = null
    try {
      pdfToImg = await import('pdf-to-img')
    } catch {
      // Optional until installed — skip soft if package missing in consumer installs
    }
    if (!pdfToImg) {
      expect(pdf.length).toBeGreaterThan(500)
      return
    }
    const document = await pdfToImg.pdf(pdf, { scale: 1 })
    let pageCount = 0
    let first: Buffer | null = null
    for await (const page of document) {
      pageCount += 1
      if (!first) first = Buffer.from(page)
    }
    expect(pageCount).toBeGreaterThanOrEqual(1)
    expect(first).toBeTruthy()
    expect(first!.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(first!.length).toBeGreaterThan(1000)
  }, 60000)
})
