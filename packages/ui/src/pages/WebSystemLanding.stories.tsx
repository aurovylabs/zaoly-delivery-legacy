import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Heading } from '../components/Heading'
import { Stack } from '../components/Stack'

/**
 * Landing proof: one composition painted only with Layer-0 web-system semantics
 * + existing primitives (no ad-hoc hex / shadow literals).
 */
function WebSystemLandingPage() {
  return (
    <div
      style={{
        minHeight: '100%',
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          padding: 'var(--space-3) var(--space-5)',
          background: 'color-mix(in srgb, var(--background) 88%, transparent)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--type-lg)',
            fontWeight: 600,
            letterSpacing: 'var(--track-tight)',
          }}
        >
          Zaoly
        </span>
        <Stack direction="row" gap="sm" align="center">
          <Button variant="ghost" size="sm">
            Docs
          </Button>
          <Button variant="primary" size="sm">
            Open studio
          </Button>
        </Stack>
      </header>

      <main style={{ padding: 'var(--space-6) var(--space-5)', maxWidth: '48rem', margin: '0 auto' }}>
        <Stack gap="lg">
          <Stack gap="sm">
            <p
              style={{
                margin: 0,
                color: 'var(--muted-foreground)',
                fontSize: 'var(--type-sm)',
                letterSpacing: 'var(--track-label)',
                textTransform: 'uppercase',
              }}
            >
              Web-system foundation
            </p>
            <Heading level={1}>One surface system for product pages</Heading>
            <p style={{ margin: 0, color: 'var(--muted-foreground)', maxWidth: '36rem' }}>
              Background, card, primary, muted, and ring resolve from Layer 0 — switch theme in the
              toolbar to verify both modes.
            </p>
          </Stack>

          <Stack direction="row" gap="md" wrap>
            <Button variant="primary">Start</Button>
            <Button variant="ghost">Browse tokens</Button>
          </Stack>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {[
              ['Tokens', 'Semantic pairs alias chrome vars without breaking --bg0 / --ink.'],
              ['Elevation', 'Shadow scale via --shadow-sm…xl — no hex hardcodes.'],
              ['Focus', 'Ring uses --ring + --ring-offset for accessible outlines.'],
            ].map(([title, body]) => (
              <Card
                key={title}
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--card)',
                  color: 'var(--card-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-panel)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <Stack gap="sm">
                  <Heading level={3}>{title}</Heading>
                  <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: 'var(--type-sm)' }}>
                    {body}
                  </p>
                </Stack>
              </Card>
            ))}
          </div>
        </Stack>
      </main>
    </div>
  )
}

const meta = {
  title: 'Pages/WebSystem/Landing',
  component: WebSystemLandingPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof WebSystemLandingPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
