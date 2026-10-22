import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './components/Button'
import { zaolyBrand, radii, spacing } from './tokens'

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '5.5rem' }}>
      <div
        style={{
          height: '2.5rem',
          borderRadius: 'var(--radius-md)',
          background: hex,
          border: '1px solid var(--line)',
        }}
        title={hex}
      />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--muted)' }}>{hex}</span>
    </div>
  )
}

function DesignTokensShowcase() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', maxWidth: '48rem' }}>
      <header>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: '0 0 0.35rem' }}>zaoly-ui tokens</h1>
        <p className="meta" style={{ margin: 0 }}>
          Switch theme in the toolbar · SoT: design-system/tokens
        </p>
      </header>

      <section>
        <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Brand
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {(Object.entries(zaolyBrand) as [string, string][]).map(([key, hex]) => (
            <Swatch key={key} label={key} hex={hex} />
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Semantic surfaces
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {[
            ['--bg0', 'var(--bg0)'],
            ['--bg1', 'var(--bg1)'],
            ['--surface', 'var(--surface)'],
            ['--accent', 'var(--accent)'],
            ['--ok', 'var(--ok)'],
            ['--danger', 'var(--danger)'],
          ].map(([label, bg]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '5.5rem' }}>
              <div
                style={{
                  height: '2.5rem',
                  borderRadius: 'var(--radius-md)',
                  background: bg,
                  border: '1px solid var(--line)',
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Spacing
        </h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
          {(Object.entries(spacing) as [string, string][]).map(([step, rem]) => (
            <div key={step} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '1.5rem',
                  height: rem,
                  margin: '0 auto',
                  background: 'var(--accent)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Radii
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {(Object.entries(radii) as [string, string][]).map(([name, value]) => (
            <div
              key={name}
              style={{
                width: '4.5rem',
                height: '3rem',
                border: '1px solid var(--accent)',
                background: 'var(--surface)',
                borderRadius: value,
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Primitives
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
          <span className="metric-chip">
            <span className="chip-label">queue</span>
            <strong>12</strong>
          </span>
          <Button variant="primary" size="sm">
            Primary
          </Button>
          <Button variant="ghost" size="sm">
            Ghost
          </Button>
          <button type="button" className="chip active">
            Chip
          </button>
          <div
            className="module-panel"
            style={{ flex: '1 1 12rem', marginTop: 0 }}
          >
            Magazine panel (alias)
          </div>
        </div>
      </section>
    </div>
  )
}

const meta = {
  title: 'Foundation/Tokens',
  component: DesignTokensShowcase,
} satisfies Meta<typeof DesignTokensShowcase>

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const Default = Overview
