import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Field } from '../components/Field'
import { Heading } from '../components/Heading'
import { Input } from '../components/Input'
import { PageTitle } from '../components/PageTitle'
import { Stack } from '../components/Stack'

/**
 * App-shell excerpt: rail + main painted with Layer-0 web-system semantics.
 */
function WebSystemAppShellPage() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(12rem, 15rem) 1fr',
        minHeight: '100%',
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <aside
        style={{
          borderRight: '1px solid var(--border)',
          background: 'var(--popover)',
          color: 'var(--popover-foreground)',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
          }}
        >
          Studio
        </span>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {['Overview', 'Collections', 'Settings'].map((label, i) => (
            <button
              key={label}
              type="button"
              style={{
                textAlign: 'left',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'default',
                background: i === 0 ? 'var(--accent-surface)' : 'transparent',
                color: i === 0 ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--type-sm)',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-5)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted-surface)',
            position: 'sticky',
            top: 0,
            zIndex: 'var(--z-sticky)',
          }}
        >
          <PageTitle>Overview</PageTitle>
          <Button variant="primary" size="sm">
            New
          </Button>
        </header>

        <main style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Card
            style={{
              padding: 'var(--space-4)',
              background: 'var(--card)',
              color: 'var(--card-foreground)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-panel)',
              boxShadow: 'var(--shadow-sm)',
              maxWidth: '28rem',
            }}
          >
            <Stack gap="md">
              <Heading level={3}>Quick create</Heading>
              <Field label="Name">
                <Input block placeholder="Collection name" defaultValue="" />
              </Field>
              <Stack direction="row" gap="sm">
                <Button variant="primary" size="sm">
                  Create
                </Button>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Card>

          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--secondary)',
              color: 'var(--secondary-foreground)',
              border: '1px solid var(--border)',
              fontSize: 'var(--type-sm)',
              maxWidth: '28rem',
            }}
          >
            Secondary surface · destructive sample:{' '}
            <Button variant="danger" size="sm">
              Remove
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}

const meta = {
  title: 'Pages/WebSystem/AppShell',
  component: WebSystemAppShellPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof WebSystemAppShellPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
