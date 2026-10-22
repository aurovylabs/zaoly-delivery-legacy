/**
 * Docs-only Mag PDF kit overview — does NOT import @react-pdf/renderer.
 * Visual twins live under Print/; Mag* ships via `@zaoly/ui/mag` subpath.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { PRINT_MAG_TWINS } from '../magazine/twins'
import { magazineColors } from '../magazine/colors'

function MagDocsOverview() {
  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui', maxWidth: 720, lineHeight: 1.5 }}>
      <p>
        Magazin-PDF primitives live in <code>@zaoly/ui/mag</code> (optional peer{' '}
        <code>@react-pdf/renderer</code>). They are <strong>not</strong> part of the main{' '}
        <code>@zaoly/ui</code> web bundle.
      </p>
      <p>
        HTML visual twins: Storybook layer <code>Print/</code>. Shared colors:{' '}
        <code>packages/ui/src/magazine/colors.ts</code>.
      </p>
      <h3>Twin map</h3>
      <ul>
        {PRINT_MAG_TWINS.map((t) => (
          <li key={t.magExport}>
            Print/{t.printStory} ↔ {t.magExport}
          </li>
        ))}
      </ul>
      <h3>Default palette (magColors)</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Object.entries(magazineColors)
          .filter(([, v]) => typeof v === 'string')
          .map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 140 }}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  background: String(v),
                  border: '1px solid #ccc',
                }}
              />
              <code style={{ fontSize: 12 }}>
                {k} {String(v)}
              </code>
            </div>
          ))}
      </div>
      <p style={{ marginTop: 16 }}>
        Theme hook: <code>MagThemeProvider</code> + <code>mergeMagazineColors</code>. Page logo:{' '}
        <code>MagPage showLogo</code> + app-injected <code>logo</code> node.
      </p>
    </div>
  )
}

const meta = {
  title: 'Mag/Overview',
  component: MagDocsOverview,
  tags: ['mag', 'docs'],
  parameters: {
    docs: {
      description: {
        component:
          'Docs-only Mag PDF kit. Do not import Mag* into the main @zaoly/ui entry — use @zaoly/ui/mag.',
      },
    },
  },
} satisfies Meta<typeof MagDocsOverview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
