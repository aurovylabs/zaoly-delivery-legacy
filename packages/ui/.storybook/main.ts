import type { StorybookConfig } from '@storybook/react-vite'

/**
 * Storybook for @zaoly/ui.
 * Staging: knowledge/staging-coolify-storybook.md · ds.projects-a.plygrnd.tech
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  core: {
    disableTelemetry: true,
  },
  docs: {
    autodocs: false,
  },
}

export default config
