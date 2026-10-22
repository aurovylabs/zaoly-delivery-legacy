import type { Meta, StoryObj } from '@storybook/react'
import { MarkdownProse } from './MarkdownProse'

const SAMPLE = `In und rund um **Remseck am Neckar** findest du mehrere deutsche Automarken.

### Vertragshändler in der Nähe

| Marke | Autohaus | Adresse |
| --- | --- | --- |
| **Volkswagen** | Hahn Automobile | Ludwigsburg |
| **BMW / MINI** | Rhein BMW | Asperg |

- Direkt in Remseck: **Autohaus Kranich** (Mitsubishi)
- Für Porsche: [Porsche Zentrum Stuttgart](https://stuttgart.porsche.de)
`

const meta: Meta<typeof MarkdownProse> = {
  title: 'Molecules/MarkdownProse',
  component: MarkdownProse,
}

export default meta

type Story = StoryObj<typeof MarkdownProse>

export const GeoAnswer: Story = {
  args: { children: SAMPLE },
}

export const AsBlockquote: Story = {
  args: { children: SAMPLE, as: 'blockquote' },
}
