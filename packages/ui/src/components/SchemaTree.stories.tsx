import type { Meta, StoryObj } from '@storybook/react-vite'
import { SchemaTree, type SchemaTreeNode } from './SchemaTree'

const scanRoot: SchemaTreeNode = {
  id: 'scan',
  key: 'scan',
  path: 'scan',
  type: 'object',
  schema: true,
  children: [
    {
      id: 'scan.overallScore',
      key: 'overallScore',
      path: 'scan.overallScore',
      type: 'number',
      value: '82',
    },
    {
      id: 'scan.issues',
      key: 'issues',
      path: 'scan.issues',
      type: 'object',
      schema: true,
      children: [
        {
          id: 'scan.issues.items',
          key: 'items',
          path: 'scan.issues.items',
          type: 'array',
          schema: true,
          children: [
            {
              id: 'scan.issues.items[item]',
              key: '[item]',
              path: 'scan.issues.items[0]',
              type: 'object',
              schema: true,
              children: [
                {
                  id: 'scan.issues.items[0].ruleId',
                  key: 'ruleId',
                  path: 'scan.issues.items[0].ruleId',
                  type: 'string',
                  schema: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const meta = {
  title: 'Molecules/SchemaTree',
  component: SchemaTree,
  args: {
    root: scanRoot,
  },
} satisfies Meta<typeof SchemaTree>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { root: [], emptyLabel: 'Noch kein Schema' },
}

export const Selectable: Story = {
  args: {
    onSelectPath: (path: string) => {
      console.log('select', path)
    },
  },
}
