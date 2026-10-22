import type { Meta, StoryObj } from '@storybook/react-vite'
import { duration, easing, motion } from './tokens/motion'

function MotionTokensShowcase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '40rem' }}>
      <header>
        <h1 style={{ margin: '0 0 0.35rem', fontFamily: 'var(--font-display)' }}>Motion</h1>
        <p className="meta" style={{ margin: 0 }}>
          Prefer semantic <code>--motion-*</code> recipes. Reduced-motion collapses to short fades.
        </p>
      </header>

      <section>
        <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Durations
        </h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {(Object.entries(duration) as [string, string][]).map(([name, value]) => (
            <li key={name} style={{ display: 'grid', gridTemplateColumns: '7rem 5rem 1fr', gap: '0.5rem', alignItems: 'center' }}>
              <code style={{ fontSize: '0.72rem' }}>{name}</code>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>{value}</span>
              <span
                style={{
                  display: 'block',
                  height: '0.35rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--accent)',
                  transformOrigin: 'left center',
                  animation: `ds-meter-fill ${value} var(--ease-enter) infinite alternate`,
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Easings
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(Object.keys(easing) as string[]).map((name) => (
            <code
              key={name}
              style={{
                fontSize: '0.68rem',
                padding: '0.35rem 0.55rem',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface)',
              }}
            >
              {name}
            </code>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Semantic recipes
        </h2>
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {(Object.entries(motion) as [string, string][]).map(([name, value]) => (
            <div
              key={name}
              className="ds-motion-enter"
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-panel)',
                background: 'var(--surface)',
              }}
            >
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>--motion-{name}</strong>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes ds-meter-fill {
          from { transform: scaleX(0.08); opacity: 0.45; }
          to { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const meta = {
  title: 'Foundation/Motion',
  component: MotionTokensShowcase,
} satisfies Meta<typeof MotionTokensShowcase>

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const Default = Overview
