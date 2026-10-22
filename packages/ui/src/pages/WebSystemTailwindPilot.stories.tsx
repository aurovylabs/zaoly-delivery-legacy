import type { Meta, StoryObj } from '@storybook/react-vite'

/**
 * Pilot for opt-in Tailwind v4 — Storybook does not load Tailwind.
 * This surface paints the **same Layer-0 vars** that `@zaoly/ui/tailwind-theme.css`
 * maps to utilities (`bg-background`, `text-primary`, `shadow-md`, …).
 */
function WebSystemTailwindPilotPage() {
  return (
    <div
      style={{
        minHeight: '100%',
        padding: 'var(--space-5)',
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        style={{
          maxWidth: '36rem',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <header>
          <h1 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--type-xl)' }}>
            Tailwind theme pilot
          </h1>
          <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: 'var(--type-sm)' }}>
            Import <code>@zaoly/ui/tailwind-theme.css</code> after{' '}
            <code>@import &quot;tailwindcss&quot;</code>. Utilities resolve to Layer-0 vars — no second
            palette.
          </p>
        </header>

        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-panel)',
            background: 'var(--card)',
            color: 'var(--card-foreground)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--type-sm)' }}>
            Equivalent to{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
              bg-card text-card-foreground border-border shadow-md
            </code>
          </p>
          <button
            type="button"
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              boxShadow: '0 0 0 2px var(--ring-offset), 0 0 0 4px var(--ring)',
              fontFamily: 'var(--font-body)',
              cursor: 'default',
            }}
          >
            bg-primary · ring
          </button>
        </div>

        <ul
          style={{
            margin: 0,
            padding: 'var(--space-3)',
            listStyle: 'none',
            background: 'var(--muted-surface)',
            color: 'var(--muted-foreground)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            border: '1px solid var(--border)',
          }}
        >
          <li>bg-background → var(--background)</li>
          <li>bg-muted → var(--muted-surface)</li>
          <li>text-muted-foreground → var(--muted-foreground)</li>
          <li>bg-primary → var(--primary)</li>
          <li>shadow-md → var(--shadow-md)</li>
        </ul>
      </div>
    </div>
  )
}

const meta = {
  title: 'Pages/WebSystem/TailwindPilot',
  component: WebSystemTailwindPilotPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof WebSystemTailwindPilotPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
