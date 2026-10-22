import React from 'react'
import type { Decorator, Preview } from '@storybook/react-vite'
import { RESPONSIVE_VIEWPORTS } from '../src/storybook/viewports'
import { restoreNativeHtmlElementFocus } from './restoreNativeFocus'
import '../src/styles.css'
import { PromotedTokenBindingsApplier } from '../src/storybook/promotedTokenBindings'

/** Re-apply if Storybook focus instrumentation re-patches between stories. */
restoreNativeHtmlElementFocus()

const THEMES = ['zaoly-dark', 'zaoly', 'zaoly-ui-dark', 'zaoly-ui', 'forest'] as const

type ThemeId = (typeof THEMES)[number]

function isThemeId(value: string): value is ThemeId {
  return (THEMES as readonly string[]).includes(value)
}

const withTheme: Decorator = (Story, context) => {
  restoreNativeHtmlElementFocus()
  const themeRaw = String(context.globals.theme ?? 'zaoly-dark')
  const theme: ThemeId = isThemeId(themeRaw) ? themeRaw : 'zaoly-dark'
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }

  const fullscreen = context.parameters.layout === 'fullscreen'
  return (
    <div
      className="story-canvas"
      style={{
        minHeight: fullscreen ? '100vh' : undefined,
        padding: fullscreen ? 0 : '1.25rem',
        background: 'var(--bg0)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <Story />
    </div>
  )
}

const withPromotedTokenBindings: Decorator = (Story, context) => {
  const tokenBindings = context.parameters?.tokenBindings
  if (!tokenBindings || typeof tokenBindings !== 'object') {
    return <Story />
  }

  return <PromotedTokenBindingsApplier tokenBindings={tokenBindings}>{<Story />}</PromotedTokenBindingsApplier>
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
    a11y: {
      test: 'todo',
    },
    viewport: {
      options: RESPONSIVE_VIEWPORTS,
    },
  },
  globalTypes: {
    theme: {
      description: 'Product UI theme (data-theme)',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: THEMES.map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'zaoly-dark',
  },
  decorators: [withTheme, withPromotedTokenBindings],
  async beforeEach() {
    restoreNativeHtmlElementFocus()
  },
}

export default preview

