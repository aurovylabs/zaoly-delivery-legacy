import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import {
  filterHudCraftDialogSlots,
  filterHudStripSlots,
  isHudCraftDialogControl,
} from '../lib/inspect/hud-quick-slots'
import { resolveHudModel } from '../lib/inspect/resolve-hud-model'
import { buildEditorContextMenuItems } from '../lib/editor/context-menu-items'

describe('hud strip slots (Style accordion retired)', () => {
  it('keeps length/sizeMode classified for docs; strip includes every Smart slot', () => {
    expect(isHudCraftDialogControl('tokenColor')).toBe(false)
    expect(isHudCraftDialogControl('tokenType')).toBe(false)
    expect(isHudCraftDialogControl('tokenLength')).toBe(true)
    expect(isHudCraftDialogControl('sizeMode')).toBe(true)
  })

  it('puts SiteText type+color on strip; Pad/Margin are craft-dialog (tokenLength) slots', () => {
    const root: SceneNode = { id: 'root', type: 'SiteStack', name: 'Root', props: {} }
    const text: SceneNode = {
      id: 't1',
      type: 'SiteText',
      name: 'Headline',
      props: { role: 'body', children: 'Hello' },
    }
    const model = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [text.id],
      selectedNodes: [text],
      workingRootId: root.id,
      primary: text,
    })
    const strip = filterHudStripSlots(model.slots)
    const craft = filterHudCraftDialogSlots(model.slots)
    expect(craft.map((s) => s.key).sort()).toEqual(['margin', 'padding'])
    expect(craft.every((s) => s.control === 'tokenLength')).toBe(true)
    expect(strip.some((s) => s.key === 'fontFamily')).toBe(true)
    expect(strip.some((s) => s.key === 'fontSize')).toBe(true)
    expect(strip.some((s) => s.key === 'fontWeight')).toBe(true)
    expect(strip.some((s) => s.key === 'color')).toBe(true)
  })

  it('keeps layout length/size slots on the strip (not a Style… button)', () => {
    const root: SceneNode = { id: 'root', type: 'SiteStack', name: 'Root', props: {} }
    const stack: SceneNode = {
      id: 's1',
      type: 'SiteStack',
      name: 'Stack',
      props: {},
    }
    const model = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [stack.id],
      selectedNodes: [stack],
      workingRootId: root.id,
      primary: stack,
    })
    const strip = filterHudStripSlots(model.slots)
    expect(strip.some((s) => s.control === 'tokenLength' || s.control === 'sizeMode')).toBe(true)
  })
})

describe('context menu without Style…', () => {
  it('omits Style item', () => {
    const items = buildEditorContextMenuItems(
      {
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        duplicate: 'Duplicate',
        delete: 'Delete',
        wrapStack: 'Wrap Stack',
        wrapGrid: 'Wrap Grid',
        unwrap: 'Unwrap',
        menuLabel: 'Menu',
      },
      {
        canCut: false,
        canCopy: false,
        canPaste: false,
        canDuplicate: false,
        canDelete: false,
        canWrap: false,
        canUnwrap: false,
      },
      {
        cut: () => undefined,
        copy: () => undefined,
        paste: () => undefined,
        duplicate: () => undefined,
        delete: () => undefined,
        wrapStack: () => undefined,
        wrapGrid: () => undefined,
        unwrap: () => undefined,
      },
    )
    expect(items.some((i) => i.id === 'style')).toBe(false)
    expect(items.some((i) => i.id === 'cut')).toBe(true)
  })
})
