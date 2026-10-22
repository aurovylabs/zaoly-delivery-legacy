import './globals.css'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import localFont from 'next/font/local'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AppProviders } from '../components/app-providers'
import { RootProvidersWithLocale } from '../components/root-providers-with-locale'
import { paths } from '../lib/paths'
import { resolveThemeId } from '@zaoly/ui'

/**
 * Zaoly CD: Geist (+ Mono) for chrome. Noto JP kept for seal 造 / CJK.
 * Spec: knowledge/corporate-design.md · cache-components-adoption.md
 */
const notoSansJp = localFont({
  src: [
    { path: '../fonts/NotoSansJP-latin-300.woff2', weight: '200', style: 'normal' },
    { path: '../fonts/NotoSansJP-latin-300.woff2', weight: '300', style: 'normal' },
    { path: '../fonts/NotoSansJP-latin.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/NotoSansJP-latin-500.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/NotoSansJP-latin-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-face-noto-sans-jp',
})

export const metadata: Metadata = {
  title: 'Zaoly',
  description: 'Standalone composition design editor — Design and code, woven into one.',
  icons: {
    // ICO first — reliable seal in tabs; SVG is baked raster (no live 造 text).
    icon: [
      { url: paths.brandAssets.favicon, sizes: 'any' },
      { url: paths.brandAssets.faviconSvg, type: 'image/svg+xml' },
    ],
    apple: paths.brandAssets.appleTouchIcon,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shellLocale = paths.defaultLocale

  return (
    <html
      lang={shellLocale}
      data-theme={resolveThemeId(paths.defaultTheme)}
      className={`${GeistSans.variable} ${GeistMono.variable} ${notoSansJp.variable}`}
      suppressHydrationWarning
    >
      {/* Extensions (custom cursors, etc.) often mutate body style before hydrate. */}
      <body className={GeistSans.className} suppressHydrationWarning>
        <Suspense fallback={<AppProviders initialLocale={shellLocale}>{children}</AppProviders>}>
          <RootProvidersWithLocale>{children}</RootProvidersWithLocale>
        </Suspense>
      </body>
    </html>
  )
}
