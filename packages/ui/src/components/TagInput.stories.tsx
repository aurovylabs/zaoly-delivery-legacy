import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { TagInput } from './TagInput'

const meta = {
  title: 'Molecules/TagInput',
  component: TagInput,
} satisfies Meta<typeof TagInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function TagInputStory() {
    const [tags, setTags] = useState(['Brand safety', 'Retail media'])
    return (
      <TagInput
        value={tags}
        onChange={setTags}
        aria-label="Keywords"
        placeholder="Add keyword…"
      />
    )
  },
}
