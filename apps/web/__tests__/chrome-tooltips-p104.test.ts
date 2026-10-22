import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { createTranslator } from '../lib/i18n'

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : []
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const next = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      return flattenKeys(child, next)
    }
    return [next]
  })
}

describe('P104 bilingual chrome tooltips', () => {
  const localesDir = path.join(__dirname, '../locales')
  const en = JSON.parse(readFileSync(path.join(localesDir, 'en.json'), 'utf8'))
  const de = JSON.parse(readFileSync(path.join(localesDir, 'de.json'), 'utf8'))

  it('keeps en/de key parity for new chrome tip namespaces', () => {
    const enKeys = new Set(flattenKeys(en))
    const deKeys = new Set(flattenKeys(de))
    expect([...enKeys].sort()).toEqual([...deKeys].sort())
    for (const key of [
      'assistant.open',
      'assistant.close',
      'editor.align.left',
      'editor.hud.addText',
      'editor.hud.toolbar',
      'editor.hud.structureActions',
    ]) {
      expect(enKeys.has(key)).toBe(true)
      expect(deKeys.has(key)).toBe(true)
    }
  })

  it('translates HUD and assistant tips in German', () => {
    const t = createTranslator('de')
    expect(t('editor.hud.addText')).toContain('Text')
    expect(t('editor.hud.addText')).not.toBe('Add Text (T)')
    expect(t('assistant.open')).toBe('Assistent öffnen')
    expect(t('editor.align.left')).toBe('Links ausrichten')
  })

  it('HUD insert controls use ChromeTip + locale keys', () => {
    const src = readFileSync(
      path.join(__dirname, '../components/canvas-floating-hud.tsx'),
      'utf8',
    )
    expect(src).toContain("t('editor.hud.addText')")
    expect(src).toContain('ChromeTip tip={t(\'editor.hud.addText\')}')
    expect(src).not.toMatch(/title="Add Text \(T\)"/)
    expect(src).toContain("aria-label={t('editor.hud.toolbar')}")
  })

  it('does not ship Plexon assistant host in Zaoly', () => {
    const assistantHost = path.join(__dirname, '../components/platform-assistant-host.tsx')
    expect(existsSync(assistantHost)).toBe(false)
  })
})
