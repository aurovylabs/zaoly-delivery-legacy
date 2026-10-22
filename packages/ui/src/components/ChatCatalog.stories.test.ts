import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)))

describe('chat Storybook CSF titles', () => {
  it('uses flat titles that map to predictable story ids', () => {
    const catalog = readFileSync(join(root, 'ChatCatalog.stories.tsx'), 'utf8')
    const names = [
      'ChatBlockPanel',
      'ChatBlockList',
      'ChatMetricGrid',
      'ChatKeyValueList',
      'ChatStepList',
      'ChatLinkList',
      'ChatAlertBlock',
      'ChatDataTable',
      'ChatCollapsible',
      'ChatEntityGrid',
      'ChatPhaseStrip',
      'ChatMomentList',
      'ChatQuoteList',
    ]
    expect(catalog).toContain("title: 'Organisms/ChatCatalog'")
    expect(catalog).toContain('export const Inventory')
    for (const name of names) {
      expect(catalog).toContain(name)
      const stories = readFileSync(join(root, `${name}.stories.tsx`), 'utf8')
      const layer = name === 'ChatCatalog' ? 'Organisms' : 'Molecules'
      expect(stories).toContain(`title: '${layer}/${name}'`)
    }
  })
})
