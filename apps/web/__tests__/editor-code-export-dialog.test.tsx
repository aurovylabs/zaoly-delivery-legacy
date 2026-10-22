// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import React from 'react'
import { EditorCodeExportDialog } from '../components/editor-code-export-dialog'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'

vi.mock('@monaco-editor/react', () => ({
  default: function MockMonaco(props: { value?: string }) {
    return <pre data-testid="monaco-export-mock">{props.value}</pre>
  },
}))

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType<{ value?: string }> }>) => {
    function DynamicMonaco(props: { value?: string }) {
      return <pre data-testid="monaco-export-mock">{props.value}</pre>
    }
    void loader
    return DynamicMonaco
  },
}))

vi.mock('next/link', () => ({
  default: function MockLink({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    onClick?: () => void
  }) {
    return (
      <a href={href} onClick={onClick} {...rest}>
        {children}
      </a>
    )
  },
}))

vi.mock('@zaoly/ui', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    Dialog: ({
      open,
      children,
      title,
      actions,
      'data-testid': testId,
      className,
      'data-resizable': dataResizable,
    }: any) =>
      open ? (
        <div
          role="dialog"
          aria-modal="true"
          data-testid={testId}
          className={className}
          data-resizable={dataResizable}
        >
          <h2>{title}</h2>
          <div>{children}</div>
          <div>{actions}</div>
        </div>
      ) : null,
  }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('EditorCodeExportDialog (P98 / P99 Developer Handoff)', () => {
  const sampleRoot: SceneNode = {
    id: 'hero-card',
    type: 'Card',
    name: 'HeroCard',
    props: {
      padding: '24px',
      direction: 'column',
    },
    children: [
      {
        id: 'heading-node',
        type: 'Heading',
        name: 'HeroHeading',
        props: {
          text: 'Design in Perfection',
        },
      },
      {
        id: 'cta-btn',
        type: 'Button',
        name: 'CtaButton',
        props: {
          label: 'Get Started',
        },
        tokenBindings: {
          color: 'color.action.primary',
        },
      },
    ],
  }

  const sampleScene: CompositionScene = {
    id: 'scene-export-test',
    name: 'Landing Page Scene',
    version: 1,
    root: sampleRoot,
    pages: [
      {
        id: 'page-1',
        name: 'Home Page',
        root: sampleRoot,
      },
    ],
    activePageId: 'page-1',
  }

  it('renders nothing when open is false', () => {
    const { container } = render(
      <EditorCodeExportDialog
        open={false}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId={null}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal with React 19 JSX by default and displays code', () => {
    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId={null}
      />,
    )

    expect(screen.getByTestId('editor-code-export-dialog')).toBeDefined()
    expect(screen.getByText('Export Code (Developer Handoff)')).toBeDefined()

    const codeBlock = screen.getByTestId('exported-code-source')
    expect(codeBlock.textContent).toContain("from '@zaoly/site-kit'")
    expect(codeBlock.textContent).toContain('HeroCard')
    expect(codeBlock.textContent).toContain('Design in Perfection')
    expect(screen.getByTestId('export-ready-banner')).toHaveAttribute('data-ready', 'true')
    expect(screen.getByTestId('export-react-consumer-site-kit')).toBeDefined()
    expect(screen.getByTestId('export-intent')).toHaveAttribute('data-ready', 'true')
    expect(screen.getByTestId('export-intent-kit-link')).toHaveAttribute('href')
  })

  it('toggles App DS consumer and shows not-ready when export target has blockers', () => {
    const dirtyRoot: SceneNode = {
      id: 'dirty',
      type: 'Stack',
      name: 'Dirty',
      style: { backgroundColor: '#000000' },
      children: [
        {
          id: 'empty-btn',
          type: 'Button',
          name: 'Empty',
          props: {},
        },
      ],
    }
    const dirtyScene: CompositionScene = {
      ...sampleScene,
      root: dirtyRoot,
      pages: [{ id: 'page-1', name: 'Home Page', root: dirtyRoot }],
    }
    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={dirtyScene}
        activePageId="page-1"
        selectedNodeId={null}
      />,
    )
    expect(screen.getByTestId('export-ready-banner')).toHaveAttribute('data-ready', 'false')
    expect(screen.getByTestId('export-copy-btn').textContent).toContain('Copy anyway')

    fireEvent.click(screen.getByTestId('export-react-consumer-zaoly-ui'))
    const codeBlock = screen.getByTestId('exported-code-source')
    expect(codeBlock.textContent).toContain("from '@zaoly/ui'")
  })

  it('jumps from ready-gate blocker to node and closes export', () => {
    const dirtyRoot: SceneNode = {
      id: 'dirty',
      type: 'Stack',
      name: 'Dirty',
      style: { backgroundColor: '#000000' },
      children: [
        {
          id: 'empty-btn',
          type: 'Button',
          name: 'Empty',
          props: {},
        },
      ],
    }
    const dirtyScene: CompositionScene = {
      ...sampleScene,
      root: dirtyRoot,
      pages: [{ id: 'page-1', name: 'Home Page', root: dirtyRoot }],
    }
    const onJumpToIssue = vi.fn()
    const onClose = vi.fn()
    render(
      <EditorCodeExportDialog
        open={true}
        onClose={onClose}
        scene={dirtyScene}
        activePageId="page-1"
        selectedNodeId={null}
        onJumpToIssue={onJumpToIssue}
      />,
    )

    const blocker = screen
      .getAllByTestId('export-ready-blocker')
      .find((el) => el.getAttribute('data-code') === 'A11Y-EMPTY-BUTTON')
    expect(blocker).toBeDefined()
    expect(blocker).toHaveAttribute('data-node-id', 'empty-btn')
    fireEvent.click(blocker!)
    expect(onJumpToIssue).toHaveBeenCalledWith('empty-btn')
    expect(onClose).toHaveBeenCalled()
  })

  it('exposes a wide, resizable dialog chrome for code handoff', () => {
    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId={null}
      />,
    )
    const dialog = screen.getByTestId('editor-code-export-dialog')
    expect(dialog).toHaveAttribute('data-resizable', 'true')
    expect(dialog.className).toContain('creation-editor-code-export-dialog')

    const css = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(
      /\.creation-editor-code-export-dialog\.ds-dialog\s*\{[^}]*width:\s*min\(92vw,\s*72rem\)/s,
    )
    expect(css).toMatch(
      /\.creation-editor-code-export-dialog\.ds-dialog\s*\{[^}]*resize:\s*both/s,
    )
  })

  it('links Explore in Kit to the export target Site Kit type', () => {
    const onClose = vi.fn()
    render(
      <EditorCodeExportDialog
        open={true}
        onClose={onClose}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId="cta-btn"
      />,
    )
    const link = screen.getByTestId('export-explore-in-kit')
    expect(link.getAttribute('href')).toContain('/kit')
    expect(link.getAttribute('href')).toContain('componentId=')
    expect(link.getAttribute('href')).toContain('SiteButton')
    fireEvent.click(link)
    expect(onClose).toHaveBeenCalled()
  })

  it('switches between all 5 export formats (React, Tailwind, SwiftUI, HTML5, Scene JSON)', () => {
    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId={null}
      />,
    )

    const codeBlock = screen.getByTestId('exported-code-source')

    // 1. Tailwind CSS
    fireEvent.click(screen.getByTestId('tab-export-tailwind'))
    expect(codeBlock.textContent).toContain('class="flex flex-col')
    expect(codeBlock.textContent).toContain('Design in Perfection')

    // 2. SwiftUI View
    fireEvent.click(screen.getByTestId('tab-export-swiftui'))
    expect(codeBlock.textContent).toContain('import SwiftUI')
    expect(codeBlock.textContent).toContain('public struct HeroCardView: View')
    expect(codeBlock.textContent).toContain('VStack(alignment: .leading, spacing: 16)')

    // 3. HTML5 Page
    fireEvent.click(screen.getByTestId('tab-export-html'))
    expect(codeBlock.textContent).toContain('<!DOCTYPE html>')
    expect(codeBlock.textContent).toContain('id="preview-root"')

    // 4. Scene JSON
    fireEvent.click(screen.getByTestId('tab-export-json'))
    expect(codeBlock.textContent).toContain('"id": "scene-export-test"')
    expect(codeBlock.textContent).toContain('"name": "Landing Page Scene"')

    // 5. Back to React
    fireEvent.click(screen.getByTestId('tab-export-react'))
    expect(codeBlock.textContent).toContain("export function HeroCard() {")
  })

  it('supports Scope toggle between Entire Page and Selected Node', () => {
    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId="cta-btn"
      />,
    )

    const codeBlock = screen.getByTestId('exported-code-source')
    // By default when selectedNodeId is provided, initial scope is selection
    expect(codeBlock.textContent).toContain('export function CtaButton() {')
    expect(codeBlock.textContent).toContain('<Button')
    expect(codeBlock.textContent).not.toContain('<Card')

    // Switch to Entire Page
    fireEvent.click(screen.getByText('Entire Page'))
    expect(codeBlock.textContent).toContain('export function HeroCard() {')
    expect(codeBlock.textContent).toContain('<Container')

    // Switch back to Selected Node
    fireEvent.click(screen.getByText(/Selected Node/))
    expect(codeBlock.textContent).toContain('export function CtaButton() {')
  })

  it('copies generated code to clipboard with visual confirmation feedback', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    })

    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId="cta-btn"
      />,
    )

    const copyBtn = screen.getByTestId('export-copy-btn')
    expect(copyBtn.textContent).toBe('Copy Code')

    fireEvent.click(copyBtn)
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledTimes(1)
      expect(copyBtn.textContent).toBe('✓ Copied!')
    })
  })

  it('copies eng pack with kit / install / import / token pack CSS / module', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    })

    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId={null}
        tokenCatalog={[
          {
            path: 'color.action.primary',
            group: 'color',
            label: 'color.action.primary',
            preview: '#f256b6',
            type: 'color',
          },
        ]}
      />,
    )

    const packBtn = screen.getByTestId('export-copy-pack-btn')
    fireEvent.click(packBtn)
    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalledTimes(1)
      expect(packBtn.textContent).toBe('✓ Pack copied!')
    })
    const pack = String(writeTextSpy.mock.calls[0]?.[0] ?? '')
    expect(pack).toContain('# Zaoly eng pack')
    expect(pack).toContain('## Kit')
    expect(pack).toContain('/kit?')
    expect(pack).toContain('## Install')
    expect(pack).toContain('pnpm add @zaoly/site-kit')
    expect(pack).toContain('## Import')
    expect(pack).toContain("from '@zaoly/site-kit'")
    expect(pack).toContain('## Token pack CSS')
    expect(pack).toContain('--ds-color-action-primary')
    expect(pack).toContain('## Media breakpoints')
    expect(pack).toContain('--zaoly-media-')
    expect(pack).toContain('## Module')
    expect(pack).toContain('HeroCard')
    expect(pack).toContain('## Intent')
    expect(pack).toContain('- Scope:')
  })

  it('copies a Storyblok handoff pack (CMS PoC, not Storybook)', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    })
    const fetchSpy = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      if ((init?.method ?? 'GET').toUpperCase() === 'GET') {
        return { ok: true, json: async () => ({ configured: true }) }
      }
      return {
        ok: true,
        json: async () => ({
          ok: true,
          storyId: 42,
          storySlug: 'home-page',
          appUrl: 'https://app.storyblok.com/#/me/spaces/1/stories/0/0/42',
        }),
      }
    })
    vi.stubGlobal('fetch', fetchSpy)
    const openSpy = vi.fn()
    vi.stubGlobal('open', openSpy)

    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId={null}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('export-copy-storyblok-btn')).toBeTruthy()
    })
    expect(screen.queryByTestId('export-storyblok-pack')).toBeNull()

    const btn = screen.getByTestId('export-copy-storyblok-btn')
    expect(btn.textContent).toBe('Send to Storyblok')
    fireEvent.click(btn)
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled()
      expect(btn.textContent).toBe('✓ Sent to Storyblok!')
    })
    expect(writeTextSpy).not.toHaveBeenCalled()
    expect(openSpy).toHaveBeenCalledWith(
      'https://app.storyblok.com/#/me/spaces/1/stories/0/0/42',
      '_blank',
      'noopener,noreferrer',
    )
    expect(screen.getByTestId('export-storyblok-link')).toBeTruthy()
  })

  it('hides Send to Storyblok when the host has no Storyblok env', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ configured: false }),
    })
    vi.stubGlobal('fetch', fetchSpy)
    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId={null}
      />,
    )
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled()
    })
    expect(screen.queryByTestId('export-copy-storyblok-btn')).toBeNull()
    expect(screen.queryByTestId('export-storyblok-pack')).toBeNull()
    expect(document.body.textContent ?? '').not.toContain('zaoly-storyblok-poc')
  })

  it('does not expose a Download action (copy-only handoff)', () => {
    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        activePageId="page-1"
        selectedNodeId="cta-btn"
      />,
    )
    expect(screen.queryByTestId('export-download-btn')).toBeNull()
    expect(screen.queryByText(/Download/i)).toBeNull()
  })

  it('supports all-pages scope with concatenated React modules', () => {
    const multiPageScene: CompositionScene = {
      ...sampleScene,
      pages: [
        sampleScene.pages![0]!,
        {
          id: 'page-2',
          name: 'About Page',
          root: {
            id: 'about-root',
            type: 'Stack',
            name: 'AboutRoot',
            children: [
              {
                id: 'about-heading',
                type: 'Heading',
                name: 'AboutHeading',
                props: { text: 'About us' },
              },
            ],
          },
        },
      ],
    }

    render(
      <EditorCodeExportDialog
        open={true}
        onClose={vi.fn()}
        scene={multiPageScene}
        activePageId="page-1"
        selectedNodeId={null}
      />,
    )

    fireEvent.click(screen.getByTestId('export-scope-all-pages'))
    const codeBlock = screen.getByTestId('exported-code-source')
    expect(codeBlock.textContent).toContain('export function HomePage()')
    expect(codeBlock.textContent).toContain('export function AboutPage()')
    expect(codeBlock.textContent).toContain('export const pages = {')
  })
})
