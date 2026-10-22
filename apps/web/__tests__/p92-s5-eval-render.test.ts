/**
 * Operator artifact dump for S5 Mag page PNG (gitignored `.tmp/`).
 * Run: npx vitest run __tests__/p92-s5-eval-render.test.ts
 */
import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { buildP92S5EvalScene, renderMagazinePdf } from '../lib/magazine-pdf'

const repoTmp = join(dirname(fileURLToPath(import.meta.url)), '../../../.tmp/p92-s5-eval')
const OUT = process.env.P92_S5_EVAL_OUT ?? repoTmp
const require = createRequire(import.meta.url)

describe('P92 S5 Mag artifact dump', () => {
  it('writes PDF + page PNG + scene JSON for visual scoring', async () => {
    mkdirSync(OUT, { recursive: true })
    const scene = buildP92S5EvalScene()
    const pdf = await renderMagazinePdf(scene, { showLogo: false })
    expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF')
    writeFileSync(join(OUT, 's5-mag.pdf'), pdf)
    writeFileSync(join(OUT, 's5-scene.json'), JSON.stringify(scene, null, 2))

    let pdfToImg: { pdf: (buf: Buffer, opts?: { scale?: number }) => AsyncIterable<Uint8Array> } | null =
      null
    try {
      const uiPkg = join(process.cwd(), '../../packages/ui')
      const resolved = require.resolve('pdf-to-img', { paths: [uiPkg] })
      pdfToImg = (await import(pathToFileURL(resolved).href)) as typeof pdfToImg
    } catch {
      pdfToImg = null
    }
    if (!pdfToImg) {
      expect(pdf.length).toBeGreaterThan(2000)
      return
    }
    const document = await pdfToImg.pdf(pdf, { scale: 2 })
    let i = 0
    for await (const page of document) {
      i += 1
      writeFileSync(join(OUT, `s5-mag-page-${i}.png`), Buffer.from(page))
    }
    expect(i).toBeGreaterThanOrEqual(1)
  }, 60000)
})
