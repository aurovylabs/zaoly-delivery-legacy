import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'

const repoRoot = path.resolve(__dirname, '../../..')

describe('dockerfile packaging', () => {
  it('exposes port 3009 and in-repo UI workspace layout', () => {
    const df = readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8')
    expect(df).toContain('EXPOSE 3009')
    expect(df).toContain('/workspace/zaoly')
    expect(df).toContain('ZAOLY_UI_SOURCE=in-repo')
    expect(df).toContain(paths.zaolyUiSourceDefault)
    expect(df).not.toContain('/workspace/zaoly-ui')
    expect(df).not.toContain('/workspace/msq' + 'dx-ui')
    expect(df).not.toMatch(/\bgit (clone|fetch|checkout)\b/)
    expect(df).toContain('packages/ui/src')
    expect(df).toContain('HubIndexCard')
    expect(df).toContain('HubIndexLayoutSwitch')
    expect(df).toContain('--success: var(--ok)')
    expect(df).toContain('--warning: var(--warn)')
    expect(df).toContain('--bad: var(--danger)')
    expect(df).toContain('selectedIds')
    expect(df).toContain('IconItalic')
    expect(df).toContain('IconBan')
    expect(df).toContain('IconStorybook')
    expect(df).toContain('emptyLabel')
    expect(df).toContain('fontPreview')
    expect(df).toContain('sampleStyle')
    expect(df).toContain('--surface-1: var(--bg1)')
    expect(df).toContain('ds-token-picker--compact')
    expect(df).toContain('ds-toggle-group--icon')
    expect(df).toContain('IconUndo')
    expect(df).toContain('onReorderDrop')
    expect(df).toContain('onToggleHidden')
    expect(df).toContain('COMPONENT_PALETTE_DND_MIME')
    expect(df).toContain('LayersPanel')
    expect(df).toContain('BreakpointSwitcher')
    expect(df).toContain('InspectTabs')
    expect(df).toContain('ChatOverlay')
    expect(df).toContain('CanvasViewport')
    expect(df).toContain('@zaoly/ui-tokens')
    expect(df).toContain('@zaoly/ui')
    expect(existsSync(path.join(repoRoot, 'scripts/docker-entrypoint.sh'))).toBe(true)
    // next start reloads next.config.ts → needs ./lib/paths at runtime
    expect(df).toContain('apps/web/lib/paths.ts')
    expect(df).toContain('apps/web/public')
  })

  it('entrypoint forces all-interfaces bind for Coolify', () => {
    const entry = readFileSync(path.join(repoRoot, 'scripts/docker-entrypoint.sh'), 'utf8')
    expect(entry).toContain('HOSTNAME=0.0.0.0')
    expect(entry).toContain('next start -H 0.0.0.0')
    expect(entry).toContain('coolify-docker-runtime.md')
  })
})
