import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { TokenPicker } from './TokenPicker'

const COLOR_OPTIONS = [
  { path: 'color.accent', preview: '#224455', label: 'color.accent' },
  { path: 'color.muted', preview: '#666666', label: 'color.muted' },
  { path: 'color.surface', preview: '#f4f4f4', label: 'color.surface' },
  { path: 'color.danger', preview: '#b33', label: 'color.danger' },
]

const meta = {
  title: 'Organisms/TokenPicker',
  component: TokenPicker,
  args: {
    value: 'color.accent',
    options: COLOR_OPTIONS,
  },
  parameters: {
    docs: {
      description: {
        component:
          'Dense token-path picker for inspect fields. Default is a compact strip + popover. Optional `allowLiteral` hybrid accepts freeform entry via `onLiteralChange`.',
      },
    },
  },
} satisfies Meta<typeof TokenPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithClear: Story = {
  render: function WithClearStory() {
    const [value, setValue] = useState<string | null>('color.accent')
    return (
      <TokenPicker
        label="Fill"
        options={COLOR_OPTIONS}
        value={value}
        onChange={setValue}
        onClear={() => setValue(null)}
      />
    )
  },
}

export const AllowNone: Story = {
  render: function AllowNoneStory() {
    const [value, setValue] = useState<string | null>(null)
    return (
      <TokenPicker
        label="Border color"
        options={COLOR_OPTIONS}
        value={value}
        onChange={setValue}
        onClear={() => setValue(null)}
        allowNone
        noneLabel="None"
      />
    )
  },
}

export const DenseList: Story = {
  args: {
    variant: 'list',
    label: 'Space',
    value: 'space.md',
    options: [
      { path: 'space.xs', label: 'space.xs' },
      { path: 'space.sm', label: 'space.sm' },
      { path: 'space.md', label: 'space.md' },
      { path: 'space.lg', label: 'space.lg' },
      { path: 'space.xl', label: 'space.xl' },
      { path: 'space.2xl', label: 'space.2xl' },
    ],
  },
}

export const WithCycle: Story = {
  render: function WithCycleStory() {
    const [value, setValue] = useState<string | null>('color.accent')
    return (
      <TokenPicker
        label="Fill"
        options={COLOR_OPTIONS}
        value={value}
        onChange={setValue}
        onClear={() => setValue(null)}
        allowNone
        allowCycle
      />
    )
  },
}

const FONT_OPTIONS = [
  {
    path: 'fontFamily.sans',
    label: 'Sans',
    fontPreview: 'ui-sans-serif, system-ui, sans-serif',
  },
  {
    path: 'fontFamily.serif',
    label: 'Serif',
    fontPreview: 'ui-serif, Georgia, serif',
  },
  {
    path: 'fontFamily.mono',
    label: 'Mono',
    fontPreview: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
]

export const FontFamily: Story = {
  render: function FontFamilyStory() {
    const [value, setValue] = useState<string | null>('fontFamily.sans')
    return (
      <TokenPicker
        label="Font"
        options={FONT_OPTIONS}
        value={value}
        onChange={setValue}
        onClear={() => setValue(null)}
        allowNone
        emptyLabel="—"
        noneLabel="None"
      />
    )
  },
}

const RADIUS_OPTIONS = [
  { path: 'radius.sm', label: 'radius.sm · 4px', preview: '4px', category: 'radius' },
  { path: 'radius.md', label: 'radius.md · 8px', preview: '8px', category: 'radius' },
  { path: 'radius.lg', label: 'radius.lg · 16px', preview: '16px', category: 'radius' },
  { path: 'space.md', label: 'space.md · 16px', preview: '16px', category: 'space' },
  { path: 'color.accent', label: 'color.accent', preview: '#224455', category: 'color' },
]

export const Browser: Story = {
  render: function BrowserStory() {
    const [value, setValue] = useState<string | null>('radius.md')
    const [scope, setScope] = useState('suggested')
    const [recent, setRecent] = useState<string[]>(['radius.sm'])
    return (
      <div style={{ minHeight: 420, padding: 24 }}>
        <TokenPicker
          label="Radius"
          browser
          allowCycle
          allowNone
          previewKind="radius"
          contextTitle="Binding for: Desktop"
          options={RADIUS_OPTIONS}
          value={value}
          onChange={setValue}
          onClear={() => setValue(null)}
          scopes={[
            { id: 'suggested', label: 'Suggested' },
            { id: 'radius', label: 'Radius' },
            { id: 'all', label: 'All' },
          ]}
          scope={scope}
          onScopeChange={setScope}
          suggestedPaths={['radius.sm', 'radius.md', 'radius.lg']}
          recentPaths={recent}
          onRecentPathsChange={setRecent}
        />
      </div>
    )
  },
}

export const BrowserColorList: Story = {
  render: function BrowserColorListStory() {
    const [value, setValue] = useState<string | null>('color.accent')
    return (
      <div style={{ minHeight: 420, padding: 24 }}>
        <TokenPicker
          label="Fill"
          browser
          allowCycle
          previewKind="color"
          options={COLOR_OPTIONS.map((o) => ({
            ...o,
            category: 'color',
            valueLabel: o.preview,
            label: o.path.split('.').pop() ?? o.path,
          }))}
          value={value}
          onChange={setValue}
          onClear={() => setValue(null)}
          allowNone
          scopes={[
            { id: 'suggested', label: 'Suggested' },
            { id: 'color', label: 'Color' },
            { id: 'all', label: 'All' },
          ]}
          suggestedPaths={COLOR_OPTIONS.map((o) => o.path)}
        />
      </div>
    )
  },
}

export const WithLiteral: Story = {
  render: function WithLiteralStory() {
    const [value, setValue] = useState<string | null>(null)
    const [literal, setLiteral] = useState('16')
    return (
      <TokenPicker
        label="Padding"
        allowLiteral
        allowCycle
        allowNone
        browser
        previewKind="space"
        options={[
          { path: 'space.sm', label: 'space.sm · 8px', preview: '8px', category: 'space' },
          { path: 'space.md', label: 'space.md · 16px', preview: '16px', category: 'space' },
          { path: 'space.lg', label: 'space.lg · 24px', preview: '24px', category: 'space' },
        ]}
        value={value}
        literalValue={literal}
        onChange={(path) => {
          setValue(path)
          setLiteral('')
        }}
        onLiteralChange={(raw) => {
          setLiteral(raw)
          setValue(null)
        }}
        onClear={() => {
          setValue(null)
          setLiteral('')
        }}
        scopes={[
          { id: 'suggested', label: 'Suggested' },
          { id: 'space', label: 'Space' },
          { id: 'all', label: 'All' },
        ]}
        suggestedPaths={['space.sm', 'space.md', 'space.lg']}
        emptyLabel="—"
        noneLabel="None"
      />
    )
  },
}
