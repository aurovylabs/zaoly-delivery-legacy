import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { narrowViewportGlobals } from '../storybook/viewports'
import { Field } from './Field'
import { Input } from './Input'
import { Select } from './Select'
import { Textarea } from './Textarea'

const meta = {
  title: 'Molecules/Field',
  component: Field,
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

const statusOptions = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ENRICH_QUEUED', label: 'Enrich queued' },
  { value: 'SKIPPED_NEAR_DUP', label: 'Skipped near-dup' },
]

export const SelectFilter: Story = {
  render: function SelectFilterStory() {
    const [status, setStatus] = useState('COMPLETED')
    return (
      <Field label="Status" size="sm" layout="inline">
        <Select value={status} onChange={setStatus} options={statusOptions} />
      </Field>
    )
  },
}

export const Default: Story = SelectFilter

export const Narrow: Story = {
  ...SelectFilter,
  globals: narrowViewportGlobals,
}

export const InlineSort: Story = {
  render: function InlineSortStory() {
    const [sort, setSort] = useState('score')
    return (
      <Field label="Sort" size="sm" layout="inline">
        <Select
          value={sort}
          onChange={setSort}
          options={[
            { value: 'score', label: 'Score' },
            { value: 'coherence', label: 'Coherence' },
            { value: 'signals', label: 'Signals' },
          ]}
        />
      </Field>
    )
  },
}

export const SearchInput: Story = {
  render: function SearchStory() {
    const [q, setQ] = useState('')
    return (
      <Input
        size="md"
        block
        className="search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search sources…"
        aria-label="Search sources"
      />
    )
  },
}

export const Multiline: Story = {
  render: function MultilineStory() {
    const [text, setText] = useState('')
    return (
      <Field label="Notes" size="sm">
        <Textarea
          block
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a short note…"
          rows={4}
        />
      </Field>
    )
  },
}

export const WithHint: Story = {
  render: function HintStory() {
    const [cat, setCat] = useState('')
    return (
      <Field label="Category" hint="Filters the ranked list" size="sm">
        <Select
          value={cat}
          onChange={setCat}
          placeholder="All"
          options={[
            { value: '', label: 'All' },
            { value: 'MARKET', label: 'MARKET' },
            { value: 'TECHNOLOGY', label: 'TECHNOLOGY' },
          ]}
        />
      </Field>
    )
  },
}

export const WithError: Story = {
  render: function ErrorStory() {
    return (
      <Field label="Display name" error="Name is required" size="sm">
        <Input block defaultValue="" />
      </Field>
    )
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    children: <Input disabled defaultValue="Locked" />,
  },
}
