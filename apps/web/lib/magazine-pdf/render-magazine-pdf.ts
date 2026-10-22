import { renderToBuffer } from '@react-pdf/renderer'
import {
  applyMagTheme,
  registerMagazinePdfFonts,
  type MagazineColors,
} from '@zaoly/ui/mag'
import type { CompositionScene } from '@zaoly/contracts'
import type { BrandTokenPackResponse } from '../inspect/token-catalog'
import { NoPrintablePagesError, sceneToMagazineDocument } from './scene-to-magazine-document'

export { NoPrintablePagesError }

export type RenderMagazinePdfOptions = {
  colors?: MagazineColors
  showLogo?: boolean
  brandPack?: BrandTokenPackResponse | null
}

export async function renderMagazinePdf(
  scene: CompositionScene,
  options: RenderMagazinePdfOptions = {},
): Promise<Buffer> {
  registerMagazinePdfFonts()
  applyMagTheme(options.colors ?? null)
  try {
    const doc = sceneToMagazineDocument(scene, {
      colors: options.colors,
      showLogo: options.showLogo,
      brandPack: options.brandPack,
    })
    const buffer = await renderToBuffer(doc)
    return Buffer.from(buffer)
  } finally {
    applyMagTheme(null)
  }
}

export function safePdfFilename(scene: CompositionScene): string {
  const base = (scene.name || scene.id || 'magazine')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80)
  return `${base || 'magazine'}.pdf`
}
