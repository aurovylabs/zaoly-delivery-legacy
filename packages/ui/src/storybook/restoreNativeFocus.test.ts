import { describe, expect, it } from 'vitest'
import { restoreNativeHtmlElementFocus } from '../../.storybook/restoreNativeFocus'

describe('restoreNativeHtmlElementFocus', () => {
  it('leaves or restores focus as a callable data property', () => {
    // Simulate Storybook 10.5 accessor that throws on prototype read.
    Object.defineProperty(HTMLElement.prototype, 'focus', {
      configurable: true,
      get() {
        void this.ownerDocument
        return function focus() {}
      },
      set() {},
    })

    expect(() => HTMLElement.prototype.focus).toThrow()

    restoreNativeHtmlElementFocus()

    const desc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'focus')
    expect(typeof desc?.value).toBe('function')
    expect(desc?.get).toBeUndefined()
    expect(() => HTMLElement.prototype.focus).not.toThrow()
  })
})
