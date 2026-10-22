import type { CompositionScene } from '@zaoly/contracts'
import { Document } from '@react-pdf/renderer'
import {
  MagPage,
  MagThemeProvider,
  mergeMagazineColors,
  type MagazineColors,
} from '@zaoly/ui/mag'
import { materializeSceneForMagazine } from '../scene/materialize-for-magazine'
import { slotPlainText } from '../scene/slots'
import type { BrandTokenPackResponse } from '../inspect/token-catalog'
import { collectScenePrintPages } from './collect-scene-print-pages'
import { flattenPrintNode } from './flatten-print-node'
import { ZaolyLogoPdf } from './ZaolyLogoPdf'
import {
  catalogForMagPaint,
  magThemeOverridesFromSceneRoot,
} from './resolve-mag-instance-paint'

export class NoPrintablePagesError extends Error {
  constructor(message = 'No printable Mag pages') {
    super(message)
    this.name = 'NoPrintablePagesError'
  }
}

export type SceneToMagazineOptions = {
  /** Resolved Mag palette (token pack live pack or DS magColors). */
  colors?: MagazineColors
  /** Creation export always shows logo (P80d). */
  showLogo?: boolean
  /** Live/fixture token pack pack for instance tokenBindings (P84). */
  brandPack?: BrandTokenPackResponse | null
}

export function sceneToMagazineDocument(
  scene: CompositionScene,
  options: SceneToMagazineOptions = {},
) {
  // Mag must see the same OP-9 cascaded props as the canvas (P83).
  const view = materializeSceneForMagazine(scene)
  const pages = collectScenePrintPages(scene)
  if (!pages.length) throw new NoPrintablePagesError()

  const catalog = catalogForMagPaint(options.brandPack)
  const instanceTheme = magThemeOverridesFromSceneRoot(view.root, catalog)
  const baseColors = options.colors
  const colors =
    Object.keys(instanceTheme).length > 0
      ? mergeMagazineColors(instanceTheme, baseColors)
      : baseColors

  const showLogo = options.showLogo !== false
  const logo = showLogo ? <ZaolyLogoPdf color={colors?.ink} /> : undefined
  const flattenCtx = { catalog }

  const pagesEl = pages.map((page) => {
    const folio =
      slotPlainText(page.children, 'label') ||
      slotPlainText(page.children, 'footer') ||
      view.name ||
      'Magazine'
    const content = flattenPrintNode(page, flattenCtx)
    return (
      <MagPage key={page.id} footerTitle={folio} showLogo={showLogo} logo={logo}>
        {content}
      </MagPage>
    )
  })

  const doc = <Document title={view.name || view.id}>{pagesEl}</Document>

  if (colors) {
    return <MagThemeProvider colors={colors}>{doc}</MagThemeProvider>
  }
  return doc
}
