/**
 * Local Storybook viewport presets for the central package.
 * Keep these package-local so stories do not depend on app config.
 */
export const VIEWPORT_IDS = {
  responsiveSm: 'responsiveSm',
  responsiveMd: 'responsiveMd',
  desktop: 'desktop',
  ultraWide: 'ultraWide',
} as const

export const RESPONSIVE_VIEWPORTS = {
  [VIEWPORT_IDS.responsiveSm]: {
    name: 'Responsive SM',
    styles: { width: '640px', height: '900px' },
    type: 'mobile' as const,
  },
  [VIEWPORT_IDS.responsiveMd]: {
    name: 'Responsive MD',
    styles: { width: '900px', height: '900px' },
    type: 'tablet' as const,
  },
  [VIEWPORT_IDS.desktop]: {
    name: 'Desktop',
    styles: { width: '1200px', height: '900px' },
    type: 'desktop' as const,
  },
  [VIEWPORT_IDS.ultraWide]: {
    name: 'Ultra-wide',
    styles: { width: '1600px', height: '1080px' },
    type: 'desktop' as const,
  },
} as const

export const narrowViewportGlobals = {
  viewport: { value: VIEWPORT_IDS.responsiveSm, isRotated: false },
} as const

export const tabletViewportGlobals = {
  viewport: { value: VIEWPORT_IDS.responsiveMd, isRotated: false },
} as const
