import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const cssPath = join(dirname(fileURLToPath(import.meta.url)), 'css/chat.css')
const chatCss = readFileSync(cssPath, 'utf8')

describe('chat chrome CSS', () => {
  it('ships overlay + open editorial surface selectors', () => {
    expect(chatCss).toContain('z-index: var(--z-modal)')
    expect(chatCss).toContain('.chat-overlay')
    expect(chatCss).toContain('.chat-overlay-sheet-dock-end')
    expect(chatCss).toContain('.chat-overlay-dock-end')
    expect(chatCss).toContain('min(32rem, 100%)')
    expect(chatCss).toContain('--chat-overlay-sheet-width')
    expect(chatCss).toContain('.chat-overlay-resize')
    expect(chatCss).toContain('.chat-panel-compact .chat-form > .ds-field')
    expect(chatCss).toContain('.chat-panel-compact')
    expect(chatCss).toContain('.chat-composer')
    expect(chatCss).toContain('.chat-send')

    expect(chatCss).toContain('.chat-panel-open')
    expect(chatCss).toContain('--chat-composer-collapsed')
    expect(chatCss).toContain('--chat-composer-expanded')
    expect(chatCss).toContain('.chat-form.is-expanded')
    expect(chatCss).toContain('.chat-send-icon')
    expect(chatCss).toContain('@keyframes chat-turn-in')
    expect(chatCss).toContain('prefers-reduced-motion')
    expect(chatCss).toContain('.ds-chat-block-panel')
    expect(chatCss).toContain('.ds-chat-block-list__title')
    expect(chatCss).toContain('.ds-chat-metric-grid')
    expect(chatCss).toContain('.ds-chat-kv__row')
    expect(chatCss).toContain('.ds-chat-steps__item')
    expect(chatCss).toContain('.ds-chat-links')
    expect(chatCss).toContain('.ds-chat-table')
    expect(chatCss).toContain('.ds-chat-collapsible')
    expect(chatCss).toContain('.ds-chat-entity-grid')
    expect(chatCss).toContain('.ds-chat-phases')
    expect(chatCss).toContain('.ds-chat-moments')
    expect(chatCss).toContain('.ds-chat-quotes')
  })
})
