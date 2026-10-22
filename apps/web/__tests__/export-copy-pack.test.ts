import { describe, expect, it } from 'vitest'
import {
  buildExportCopyPack,
  extractPackageImportLine,
  installCommandForConsumer,
  resolveExportKitAbsoluteUrl,
} from '../lib/codegen/export-copy-pack'
import { paths } from '../lib/paths'

describe('export-copy-pack', () => {
  it('extracts the package import line from a module', () => {
    const module = `/** header */
import { Button, Stack } from '@zaoly/site-kit'

export function Hero() {
  return <Stack />
}
`
    expect(extractPackageImportLine(module)).toBe(
      "import { Button, Stack } from '@zaoly/site-kit'",
    )
  })

  it('builds install commands per consumer', () => {
    expect(installCommandForConsumer('site-kit')).toBe(`pnpm add ${paths.siteKitPackageName}`)
    expect(installCommandForConsumer('zaoly-ui')).toBe('pnpm add @zaoly/ui')
  })

  it('formats a markdown eng pack with kit / install / import / css / media / module', () => {
    const pack = buildExportCopyPack({
      moduleSource: `import { Stack } from '@zaoly/site-kit'\n\nexport function X() { return <Stack /> }\n`,
      kitHref: '/kit?componentId=SiteStack',
      consumer: 'site-kit',
      tokenPackCss: ':root {\n  --ds-color-action-primary: #f256b6;\n}\n',
      kitAbsoluteUrl: 'https://creation-v3.projects-a.plygrnd.tech/kit?componentId=SiteStack',
      intentMarkdown: '- Scope: page\n- Ready for eng: yes',
    })
    expect(pack).toContain('# Zaoly eng pack')
    expect(pack).toContain('## Intent')
    expect(pack).toContain('- Scope: page')
    expect(pack).toContain('## Kit')
    expect(pack).toContain('https://creation-v3.projects-a.plygrnd.tech/kit?componentId=SiteStack')
    expect(pack).toContain('## Install')
    expect(pack).toContain(`pnpm add ${paths.siteKitPackageName}`)
    expect(pack).toContain('## Import')
    expect(pack).toContain("import { Stack } from '@zaoly/site-kit'")
    expect(pack).toContain('## Token pack CSS')
    expect(pack).toContain('--ds-color-action-primary')
    expect(pack).toContain('## Media breakpoints')
    expect(pack).toContain('--zaoly-media-tablet: 768px')
    expect(pack).toContain('@media (min-width: 768px)')
    expect(pack).toContain('## Module')
    expect(pack).toContain('export function X()')
  })

  it('resolves an absolute Kit URL from a relative href', () => {
    const url = resolveExportKitAbsoluteUrl('/kit?componentId=X')
    expect(url).toMatch(/^https?:\/\//)
    expect(url).toContain('/kit?componentId=X')
  })
})
