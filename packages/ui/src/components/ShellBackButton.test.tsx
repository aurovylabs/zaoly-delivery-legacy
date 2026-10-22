import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AppFrame } from './AppFrame'
import { ShellBackButton } from './ShellBackButton'

const frameCss = readFileSync(path.resolve(__dirname, '../css/frame.css'), 'utf8')
const ultraCss = readFileSync(path.resolve(__dirname, '../css/ultra-wide.css'), 'utf8')

afterEach(() => {
  cleanup()
})

describe('ShellBackButton', () => {
  it('renders icon plaque with accessible label', () => {
    render(<ShellBackButton label="Zurück" onClick={() => undefined} />)
    expect(screen.getByTestId('shell-back-corner')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeInTheDocument()
  })

  it('fires onClick', () => {
    const onClick = vi.fn()
    render(<ShellBackButton label="Back" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders as link when href is set', () => {
    render(<ShellBackButton label="Back" href="/home" />)
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/home')
  })

  it('CSS keeps plaque flush top-left', () => {
    expect(frameCss).toMatch(/\.shell-back-corner\s*\{[^}]*top:\s*0/)
    expect(frameCss).toMatch(/\.shell-back-corner\s*\{[^}]*left:\s*0/)
    expect(frameCss).toMatch(/\.shell-back-corner-box\s*\{[^}]*border:\s*0/)
    expect(ultraCss).toMatch(/\.shell-back-corner-box\s*\{[^}]*border:\s*0/)
  })
})

describe('AppFrame backCorner', () => {
  it('omits TL shell scoop when backCorner is set', () => {
    const { container } = render(
      <AppFrame backCorner={<ShellBackButton label="Back" onClick={() => undefined} />}>
        body
      </AppFrame>,
    )
    expect(screen.getByTestId('shell-back-corner')).toBeTruthy()
    expect(container.querySelector('.shell-corner--top-left')).toBeNull()
  })
})
