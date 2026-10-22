import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { inspectFieldsForType } from '../lib/inspect/field-catalog'
import {
  lookupConsumePaths,
  suggestedBinds,
  COMPONENT_SEMANTIC_MAP,
} from '../lib/ds-deposit/component-semantic-map'
import { paths } from '../lib/paths'

const repoRoot = path.resolve(__dirname, '../../..')
const localMap = path.join(repoRoot, paths.dsDepositComponentSemanticMapPath)
const brandionCanonical = path.join(
  repoRoot,
  '../brandion-v3/knowledge/ds-deposit-component-semantic-map.json',
)

describe('DS-DEPOSIT D5 consume map lookup', () => {
  it('Button primary consumes color.action.primary', () => {
    const refs = lookupConsumePaths('Button', { variant: 'primary' })
    expect(refs.map((r) => r.path)).toContain('color.action.primary')
    expect(COMPONENT_SEMANTIC_MAP.wave).toMatch(/^D5/)
    expect(JSON.stringify(COMPONENT_SEMANTIC_MAP.entries)).not.toContain('button.variant.ghost')
  })

  it('defaults variant when unset and unions size/shape', () => {
    const refs = lookupConsumePaths('Button', { size: 'sm', shape: 'pill' })
    const pathsFound = refs.map((r) => r.path)
    expect(pathsFound).toContain('color.action.primary')
    expect(pathsFound).toContain('typography.scale.sm')
    expect(pathsFound).toContain('radius.pill')
    expect(pathsFound).toContain('spacing.static.1')
  })

  it('Badge / Alert / Chip / Panel lookups', () => {
    expect(lookupConsumePaths('Badge', { tone: 'accent' }).map((r) => r.path)).toContain(
      'color.action.primary',
    )
    expect(lookupConsumePaths('Alert', { tone: 'ok' }).map((r) => r.path)).toContain(
      'color.status.ok',
    )
    expect(lookupConsumePaths('Chip', { selected: true }).map((r) => r.path)).toContain(
      'color.action.primary',
    )
    expect(lookupConsumePaths('Panel', { variant: 'default' }).map((r) => r.path)).toContain(
      'radius.panel',
    )
  })

  it('suggests bind for Button color/background when those inspect fields exist and are unbound', () => {
    const refs = lookupConsumePaths('Button', { variant: 'primary' })
    const fields = inspectFieldsForType('Button')
    const suggested = suggestedBinds(refs, fields, {})
    expect(fields.some((f) => f.name === 'background' && f.kind === 'token')).toBe(true)
    expect(suggested.some((s) => s.field === 'background' && s.path === 'color.action.primary')).toBe(
      true,
    )
    const alreadyBound = suggestedBinds(refs, fields, { background: 'color.brand.green' })
    expect(alreadyBound.some((s) => s.field === 'background')).toBe(false)
  })

  it('copied JSON matches brandion canonical when sibling exists', () => {
    expect(existsSync(localMap)).toBe(true)
    if (!existsSync(brandionCanonical)) return
    expect(readFileSync(localMap, 'utf8')).toBe(readFileSync(brandionCanonical, 'utf8'))
  })

  it('inspect does not surface Consumes chrome (CT-16)', () => {
    const inspector = readFileSync(
      path.join(repoRoot, 'apps/web/components/editor-inspector.tsx'),
      'utf8',
    )
    expect(inspector).not.toContain('editor-inspect-consumes')
    expect(inspector).not.toContain('lookupConsumePaths')
    expect(inspector).not.toContain('suggestedBinds')
  })
})
