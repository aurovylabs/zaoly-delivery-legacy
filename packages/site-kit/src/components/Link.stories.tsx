import type { Meta, StoryObj } from '@storybook/react-vite'
import { Link } from './Link'
const meta = { title: 'Site/Link', component: Link, tags: ['site-kit'], args: { children: 'Learn more', href: '#' } } satisfies Meta<typeof Link>
export default meta
export const Default: StoryObj<typeof meta> = {}
