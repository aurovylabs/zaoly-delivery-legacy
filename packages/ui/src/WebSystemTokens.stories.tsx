import type { Meta, StoryObj } from '@storybook/react-vite'
import { breakpoints, shadows, zIndex } from './tokens'

const SEMANTIC_PAIRS: Array<[string, string]> = [
  ['--background', '--foreground'],
  ['--card', '--card-foreground'],
  ['--popover', '--popover-foreground'],
  ['--primary', '--primary-foreground'],
  ['--secondary', '--secondary-foreground'],
  ['--muted-surface', '--muted-foreground'],
  ['--accent-surface', '--accent-foreground'],
  ['--destructive', '--destructive-foreground'],
]

function PairSwatch({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <div
      style={{
        minWidth: '9rem',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: `var(${bg})`,
        color: `var(${fg})`,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{label}</div>
      <div style={{ fontSize: '0.72rem', marginTop: '0.35rem' }}>Aa · focus</div>
      <div
        style={{
          marginTop: '0.5rem',
          height: '0.35rem',
          borderRadius: 'var(--radius-pill)',
          outline: '2px solid var(--ring)',
          outlineOffset: '2px',
          background: 'var(--ring-offset)',
        }}
      />
    </div>
  )
}

function WebSystemTokensBoard() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
        maxWidth: '52rem',
        padding: 'var(--space-4)',
        background: 'var(--background)',
        color: 'var(--foreground)',
        minHeight: '100%',
      }}
    >
      <header>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: '0 0 0.35rem', fontSize: 'var(--type-2xl)' }}>
          Web-system tokens
        </h1>
        <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: 'var(--type-sm)' }}>
          Layer 0 semantics · specs/domain/web-system-tokens.md · theme toolbar
        </p>
      </header>

      <section>
        <h2
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}
        >
          Semantic pairs
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {SEMANTIC_PAIRS.map(([bg, fg]) => (
            <PairSwatch key={bg} bg={bg} fg={fg} label={`${bg} / ${fg}`} />
          ))}
          <div
            style={{
              minWidth: '9rem',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--input)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
            }}
          >
            --input / --border
          </div>
        </div>
      </section>

      <section>
        <h2
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}
        >
          Shadows
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {(Object.keys(shadows) as Array<keyof typeof shadows>).map((step) => (
            <div
              key={step}
              style={{
                width: '5.5rem',
                height: '3.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--card)',
                color: 'var(--card-foreground)',
                boxShadow: `var(--shadow-${step})`,
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                border: '1px solid var(--border)',
              }}
            >
              {step}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}
        >
          Ring
        </h2>
        <button
          type="button"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            boxShadow: '0 0 0 2px var(--ring-offset), 0 0 0 4px var(--ring)',
            fontFamily: 'var(--font-body)',
            cursor: 'default',
          }}
        >
          Focus ring sample
        </button>
      </section>

      <section>
        <h2
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}
        >
          z-Index
        </h2>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
          }}
        >
          {(Object.entries(zIndex) as [string, number][]).map(([name, value]) => {
            const cssName = name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
            return (
            <li key={name}>
              --z-{cssName}: {value}
            </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--muted-foreground)',
          }}
        >
          Breakpoints
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(Object.entries(breakpoints) as [string, string][]).map(([name, value]) => (
            <span
              key={name}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--muted-surface)',
                color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                border: '1px solid var(--border)',
              }}
            >
              --breakpoint-{name}: {value}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}

const meta = {
  title: 'Foundation/WebSystemTokens',
  component: WebSystemTokensBoard,
} satisfies Meta<typeof WebSystemTokensBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Board: Story = {}
