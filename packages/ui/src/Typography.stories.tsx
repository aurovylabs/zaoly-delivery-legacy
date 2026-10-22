import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from './components/Text'
import { fontStacks, fontWeights, letterSpacing, textRoles, typeSteps } from './tokens/typography'

function TypographyShowcase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '42rem' }}>
      <header>
        <Text role="display">Typography</Text>
        <Text role="hint">Spec: specs/domain/zaoly-ui-typography.md · switch theme in toolbar</Text>
      </header>

      <section>
        <Text role="label">Faces</Text>
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.65rem' }}>
          <p style={{ fontFamily: fontStacks.body, margin: 0 }}>
            Body — Noto Sans JP — The quick brown fox 0123456789
          </p>
          <p style={{ fontFamily: fontStacks.display, fontWeight: 200, margin: 0, fontSize: '1.35rem' }}>
            Display — thin — Signals &amp; waves
          </p>
          <p style={{ fontFamily: fontStacks.mono, fontSize: '0.65rem', margin: 0, letterSpacing: '0.04em' }}>
            Mono — IBM Plex — /research?q=ask · index 01
          </p>
        </div>
      </section>

      <section>
        <Text role="label">Size steps</Text>
        <ul style={{ listStyle: 'none', margin: '0.65rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {(Object.entries(typeSteps) as [string, string][]).map(([name, value]) => (
            <li key={name} style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <code style={{ width: '5rem', fontSize: '0.65rem', color: 'var(--muted)' }}>{name}</code>
              <span style={{ fontSize: value, fontFamily: 'var(--font-body)' }}> ag </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--muted)' }}>{value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Text role="label">Weights</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.65rem' }}>
          {(Object.entries(fontWeights) as [string, number][]).map(([name, w]) => (
            <span key={name} style={{ fontWeight: w, fontSize: '1rem' }}>
              {name} {w}
            </span>
          ))}
        </div>
      </section>

      <section>
        <Text role="label">Tracking</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.65rem' }}>
          {(Object.entries(letterSpacing) as [string, string][]).map(([name, value]) => (
            <span key={name} style={{ letterSpacing: value, fontSize: '0.78rem' }}>
              track-{name}: {value} — CATEGORY PATH
            </span>
          ))}
        </div>
      </section>

      <section>
        <Text role="label">Roles</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.65rem' }}>
          {textRoles.map((role) => (
            <div key={role}>
              <Text role="mono" size="2xs">
                role={role}
              </Text>
              <Text role={role}>
                {role === 'hint'
                  ? 'Click → /signals?category=policy'
                  : role === 'headline'
                    ? 'Large signal headline stays display-scale'
                  : role === 'numeric'
                    ? '1 284 · 42%'
                    : `The ${role} role sets face, size, and weight.`}
              </Text>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const meta = {
  title: 'Foundation/Typography',
  component: TypographyShowcase,
} satisfies Meta<typeof TypographyShowcase>

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const Default = Overview
