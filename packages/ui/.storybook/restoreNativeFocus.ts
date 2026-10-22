/**
 * Storybook 10.5 replaces `HTMLElement.prototype.focus` with an accessor whose
 * getter touches `this.ownerDocument`. addon-docs (react-aria) reads focus off
 * the prototype to wrap it → `TypeError: Illegal invocation`.
 *
 * Upstream: storybookjs/storybook#35503 · fix #35528 (in 10.6 alphas, not in 10.5.5).
 * Remove this shim once we ship a Storybook release that includes #35528.
 */
export function restoreNativeHtmlElementFocus(): void {
  if (typeof document === 'undefined' || typeof HTMLElement === 'undefined') return

  const desc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'focus')
  // Already a plain method (native or previously restored).
  if (desc && typeof desc.value === 'function' && !desc.get) return

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText =
    'position:absolute;width:0;height:0;border:0;visibility:hidden;pointer-events:none'
  document.documentElement.appendChild(iframe)

  try {
    const win = iframe.contentWindow
    if (!win?.HTMLElement?.prototype?.focus) return
    const nativeFocus = win.HTMLElement.prototype.focus
    Object.defineProperty(HTMLElement.prototype, 'focus', {
      configurable: true,
      writable: true,
      enumerable: true,
      value: function focus(this: HTMLElement, options?: FocusOptions): void {
        return nativeFocus.call(this, options)
      },
    })
  } finally {
    iframe.remove()
  }
}

restoreNativeHtmlElementFocus()
