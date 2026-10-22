import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'

const creationOrigin =
  process.env.STORYBOOK_ZAOLY_ORIGIN?.trim() ||
  'https://creation-v3.projects-a.plygrnd.tech'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  core: { disableTelemetry: true },
  docs: { autodocs: false },
  async viteFinal(config) {
    return mergeConfig(config, {
      define: {
        'import.meta.env.STORYBOOK_ZAOLY_ORIGIN': JSON.stringify(creationOrigin),
        'process.env.STORYBOOK_ZAOLY_ORIGIN': JSON.stringify(creationOrigin),
      },
    })
  },
}

export default config
