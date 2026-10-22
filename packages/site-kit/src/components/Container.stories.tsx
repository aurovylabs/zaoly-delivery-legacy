import type { Meta, StoryObj } from '@storybook/react-vite'
import { Container } from './Container'
const meta = { title: 'Site/Container', component: Container, tags: ['site-kit'] } satisfies Meta<typeof Container>
export default meta
export const Default: StoryObj<typeof meta> = { render: () => <Container><p>Contained content</p></Container> }
