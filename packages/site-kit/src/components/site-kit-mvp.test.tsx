import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { CompositionPreview } from './CompositionPreview'
import { Container } from './Container'
import { Divider } from './Divider'
import { Grid } from './Grid'
import { Image, SITE_IMAGE_PLACEHOLDER_SRC } from './Image'
import { Select } from './Select'
import { Stack } from './Stack'
import { Svg, SITE_SVG_PLACEHOLDER_MARKUP } from './Svg'
import { Text } from './Text'

describe('site-kit atoms', () => {
  it('renders Button', () => {
    render(<Button>Go</Button>)
    expect(screen.getByRole('button', { name: 'Go' })).toBeTruthy()
  })

  it('nests Text + Button in Stack', () => {
    render(
      <Stack>
        <Text role="display">Nested title</Text>
        <Button>Nested CTA</Button>
      </Stack>,
    )
    expect(screen.getByText('Nested title')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Nested CTA' })).toBeTruthy()
  })

  it('CompositionPreview applies style and strips paint props', () => {
    const { container } = render(
      <CompositionPreview
        node={{
          type: 'SiteStack',
          props: {
            direction: 'row',
            padding: '99',
            gap: 'lg',
            alignItems: 'center',
          },
          style: { padding: '1rem', gap: 'var(--site-space-5)', alignItems: 'center' },
          children: [
            {
              type: 'SiteText',
              props: { role: 'body', children: 'Painted', textAlign: 'right' },
              style: { textAlign: 'right' },
            },
          ],
        }}
      />,
    )
    expect(screen.getByText('Painted')).toBeTruthy()
    const stack = container.querySelector('.site-stack') as HTMLElement
    expect(stack).toBeTruthy()
    expect(stack.style.padding).toBe('1rem')
    expect(stack.style.gap).toBe('var(--site-space-5)')
    expect(stack.getAttribute('padding')).toBeNull()
    expect(stack.getAttribute('gap')).toBeNull()
  })

  it('CompositionPreview accepts codegen trees that omit props', () => {
    const { container } = render(
      <CompositionPreview
        node={{
          type: 'SiteStack',
          style: { gap: '1rem' },
          children: [{ type: 'SiteButton', props: { children: 'CTA' } }],
        }}
      />,
    )
    expect(screen.getByRole('button', { name: 'CTA' })).toBeTruthy()
    expect(container.querySelector('.site-stack')).toBeTruthy()
  })

  it('SiteContainer direction row lays out children horizontally', () => {
    const { container } = render(
      <Container direction="row">
        <Button>Get started</Button>
        <Badge>NEW</Badge>
      </Container>,
    )
    const shell = container.querySelector('.site-container') as HTMLElement
    expect(shell.className).toContain('site-container--row')
    expect(shell.style.display).toBe('flex')
    expect(shell.style.flexDirection).toBe('row')
  })

  it('Divider forwards style', () => {
    const { container } = render(<Divider style={{ marginTop: '2rem', borderColor: 'red' }} />)
    const hr = container.querySelector('.site-divider') as HTMLElement
    expect(hr.style.marginTop).toBe('2rem')
    expect(hr.style.borderColor).toBe('red')
  })

  it('renders Image with src and alt', () => {
    const { container } = render(
      <Image src={SITE_IMAGE_PLACEHOLDER_SRC} alt="Hero shot" />,
    )
    const img = container.querySelector('img.site-img') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.src).toContain('placehold.co')
    expect(img.alt).toBe('Hero shot')
  })

  it('CompositionPreview paints SiteImage without children', () => {
    const { container } = render(
      <CompositionPreview
        node={{
          type: 'SiteImage',
          props: { src: SITE_IMAGE_PLACEHOLDER_SRC, alt: 'Painted img' },
          style: { maxWidth: '200px' },
        }}
      />,
    )
    const img = container.querySelector('img.site-img') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.alt).toBe('Painted img')
    expect(img.style.maxWidth).toBe('200px')
  })

  it('Svg paints sanitized markup', () => {
    const { container } = render(
      <Svg markup={SITE_SVG_PLACEHOLDER_MARKUP} alt="Seal" />,
    )
    const host = container.querySelector('.site-svg') as HTMLElement
    expect(host).toBeTruthy()
    expect(host.getAttribute('aria-label')).toBe('Seal')
    expect(host.querySelector('svg')).toBeTruthy()
  })

  it('Svg recolors via host color / currentColor', () => {
    const { container } = render(
      <Svg
        markup={SITE_SVG_PLACEHOLDER_MARKUP}
        alt="Tinted"
        style={{ color: '#00ca55' }}
      />,
    )
    const host = container.querySelector('.site-svg') as HTMLElement
    expect(host.style.color).toBe('rgb(0, 202, 85)')
    expect(host.innerHTML).toMatch(/currentColor/)
  })

  it('CompositionPreview paints SiteSvg', () => {
    const { container } = render(
      <CompositionPreview
        node={{
          type: 'SiteSvg',
          props: { markup: SITE_SVG_PLACEHOLDER_MARKUP, alt: 'Mark' },
          style: { width: '48px' },
        }}
      />,
    )
    const host = container.querySelector('.site-svg') as HTMLElement
    expect(host).toBeTruthy()
    expect(host.querySelector('svg')).toBeTruthy()
  })

  it('Grid columns map to gridTemplateColumns', () => {
    const { container } = render(
      <Grid columns="3">
        <Button>A</Button>
        <Button>B</Button>
        <Button>C</Button>
      </Grid>,
    )
    const shell = container.querySelector('.site-grid') as HTMLElement
    expect(shell.style.display).toBe('grid')
    expect(shell.style.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
    )
  })

  it('Checkbox applies style on the label shell', () => {
    const { container } = render(
      <Checkbox style={{ color: 'rgb(255, 0, 0)', gap: '12px' }}>Agree</Checkbox>,
    )
    const label = container.querySelector('.site-checkbox') as HTMLElement
    expect(label.style.color).toBe('rgb(255, 0, 0)')
    expect(label.style.gap).toBe('12px')
    const input = label.querySelector('input') as HTMLInputElement
    expect(input.style.color).toBe('')
  })

  it('Select options prop renders option elements', () => {
    const { container } = render(
      <Select options={'Alpha\nbeta|Beta'} aria-label="pick" />,
    )
    const opts = Array.from(container.querySelectorAll('option')).map((o) => ({
      value: o.getAttribute('value'),
      text: o.textContent,
    }))
    expect(opts).toEqual([
      { value: 'Alpha', text: 'Alpha' },
      { value: 'beta', text: 'Beta' },
    ])
  })

  it('Button inline color overrides variant CSS vars', () => {
    const { container } = render(
      <Button variant="primary" style={{ color: 'rgb(0, 128, 0)', backgroundColor: 'rgb(255, 255, 0)' }}>
        Paint
      </Button>,
    )
    const btn = container.querySelector('.site-btn') as HTMLElement
    expect(btn.style.color).toBe('rgb(0, 128, 0)')
    expect(btn.style.backgroundColor).toBe('rgb(255, 255, 0)')
  })
})
