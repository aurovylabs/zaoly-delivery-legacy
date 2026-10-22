import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { AccentPreference } from '../accentPreference'
import { AccentSwatchGroup } from './AccentSwatchGroup'
import { ToggleGroup } from './ToggleGroup'
import { SettingsBand, SettingsShell } from './SettingsShell'
import { Text } from './Text'

const meta = {
  title: 'Organisms/SettingsShell',
  component: SettingsShell,
} satisfies Meta<typeof SettingsShell>

export default meta
type Story = StoryObj<typeof meta>

function AppearanceDemo() {
  const [theme, setTheme] = useState('dark')
  const [accent, setAccent] = useState<AccentPreference>('green')
  return (
    <div className="ds-settings-appearance-stack">
      <ToggleGroup
        aria-label="Theme"
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'auto', label: 'Auto' },
        ]}
      />
      <AccentSwatchGroup value={accent} onChange={setAccent} />
    </div>
  )
}

export const MagazineCore: Story = {
  args: {
    labels: {
      account: 'Account',
      profile: 'Profile',
      appearance: 'Appearance',
      language: 'Language',
    },
    account: <Text role="meta">demo@zaoly.local</Text>,
    profile: <Text role="body">Display name</Text>,
    appearance: <AppearanceDemo />,
    language: (
      <ToggleGroup
        aria-label="Language"
        value="en"
        onChange={() => undefined}
        options={[
          { value: 'en', label: 'English' },
          { value: 'de', label: 'Deutsch' },
        ]}
      />
    ),
    extras: (
      <SettingsBand title="Federation">
        <Text role="meta">2026-05-plexon-federation-v3</Text>
      </SettingsBand>
    ),
  },
}
