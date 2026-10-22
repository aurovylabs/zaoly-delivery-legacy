// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { EditorStorybookDialog } from '../components/editor/editor-storybook-dialog'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'

vi.mock('@zaoly/ui', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    Dialog: ({ open, children, title, actions, 'data-testid': testId, className }: any) =>
      open ? (
        <div role="dialog" aria-modal="true" data-testid={testId} className={className}>
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

describe('EditorStorybookDialog (Item 4: Site Kit Storybook Promotion & Export UI in Perfection)', () => {
  const dummyTranslate = (key: string, params?: Record<string, string>) => {
    if (params) {
      return Object.entries(params).reduce(
        (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
        key,
      )
    }
    return key
  }

  const sampleScene: CompositionScene = {
    id: 'scene-test',
    name: 'Test Scene',
    version: 1,
    platformProjectId: '32498667-471e-4b21-b920-5eff5c338300',
    activeBreakpoint: 'desktop',
    root: {
      id: 'root-1',
      type: 'SiteStack',
      name: 'Root Frame',
      children: [],
    },
    masters: [
      {
        id: 'master-1',
        name: 'Hero Button',
        root: {
          id: 'btn-root',
          type: 'SiteButton',
          name: 'Button Primary',
          props: { children: 'Click me', variant: 'primary' },
        },
        variants: [
          {
            id: 'var-1',
            name: 'Primary',
            root: { id: 'btn-var-1', type: 'SiteButton', name: 'Primary' },
          },
          {
            id: 'var-2',
            name: 'Secondary',
            root: { id: 'btn-var-2', type: 'SiteButton', name: 'Secondary' },
          },
        ],
      },
    ],
    updatedAt: '2026-09-07T12:00:00Z',
  }

  const sampleSelectedNode: SceneNode = {
    id: 'inst-1',
    type: 'SiteStack',
    name: 'Hero Section',
    props: { masterId: 'master-1' },
    children: [
      {
        id: 'child-text',
        type: 'SiteText',
        name: 'Title',
        props: { children: 'Welcome to CREATION v3' },
      },
    ],
  }

  beforeEach(() => {
    // Mock fetch for compositions catalog
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/site-kit/compositions')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              compositions: [
                {
                  name: 'MarketingHero',
                  exportName: 'MarketingHero',
                  title: 'Compositions/MarketingHero',
                  platformProjectId: '32498667-471e-4b21-b920-5eff5c338300',
                },
              ],
            }),
        })
      }
      if (url.includes('/api/site-kit/publish')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              published: 1,
              componentIds: ['SiteButton'],
              wrote: ['packages/site-kit/src/components/Button.stories.tsx'],
              storybookRedeploy: { status: 'queued', reason: 'publish:SiteButton' },
            }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      })
    }) as any
  })

  it('renders dialog with header, status badge, and navigation tabs', () => {
    render(
      <EditorStorybookDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        selectedNode={null}
        activeBreakpoint="desktop"
        platformProjectId="32498667-471e-4b21-b920-5eff5c338300"
        t={dummyTranslate}
      />,
    )

    expect(screen.getByTestId('editor-storybook-dialog')).toBeTruthy()
    expect(screen.getByTestId('storybook-status-badge')).toBeTruthy()
    expect(screen.getByTestId('tab-storybook-publish')).toBeTruthy()
    expect(screen.getByTestId('kit-playground-primary-cta')).toBeTruthy()
    expect(screen.getByTestId('kit-playground-primary-button')).toBeTruthy()
    expect(screen.getByTestId('tab-storybook-promote')).toBeTruthy()
    expect(screen.getByTestId('tab-storybook-catalog')).toBeTruthy()
  })

  it('displays publishable masters and handles Publish All', async () => {
    const onSiteKitStatus = vi.fn()
    render(
      <EditorStorybookDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        selectedNode={null}
        activeBreakpoint="desktop"
        platformProjectId="32498667-471e-4b21-b920-5eff5c338300"
        t={dummyTranslate}
        onSiteKitStatus={onSiteKitStatus}
      />,
    )

    expect(screen.getByText('Hero Button')).toBeTruthy()
    expect(screen.getByText('2 variants')).toBeTruthy()

    const publishBtn = screen.getByTestId('storybook-publish-all-btn')
    expect(publishBtn).toBeEnabled()
    fireEvent.click(publishBtn)

    await waitFor(() => {
      expect(screen.getByTestId('storybook-publish-result-msg')).toBeTruthy()
    })
  })

  it('promotes selection with live PascalCase preview and CSF code generation', async () => {
    const onCompositionSaved = vi.fn()
    render(
      <EditorStorybookDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        selectedNode={sampleScene.masters![0].variants![0].root}
        masterEditId="master-1"
        activeBreakpoint="desktop"
        platformProjectId="32498667-471e-4b21-b920-5eff5c338300"
        t={dummyTranslate}
        onCompositionSaved={onCompositionSaved}
      />,
    )

    // Switch to promote tab
    fireEvent.click(screen.getByTestId('tab-storybook-promote'))

    const nameInput = screen.getByTestId('storybook-promote-name-input')
    fireEvent.change(nameInput, { target: { value: 'feature showcase' } })

    // Normalized name preview
    expect(screen.getByText('FeatureShowcase')).toBeTruthy()

    // Code preview should generate CSF
    const preview = screen.getByTestId('storybook-promote-code-preview')
    expect(preview.textContent).toContain('FeatureShowcase')
    expect(preview.textContent).toContain('export default meta')

    // Switch to TSX tab
    fireEvent.click(screen.getByTestId('tab-preview-tsx'))
    expect(preview.textContent).toContain('export function FeatureShowcase()')
  })

  it('renders component catalog with atoms and direct deep links', async () => {
    render(
      <EditorStorybookDialog
        open={true}
        onClose={vi.fn()}
        scene={sampleScene}
        selectedNode={null}
        activeBreakpoint="desktop"
        platformProjectId="32498667-471e-4b21-b920-5eff5c338300"
        siteKitStorybookUrl="https://storybook.creation.plygrnd.tech"
        t={dummyTranslate}
      />,
    )

    // Switch to catalog tab
    fireEvent.click(screen.getByTestId('tab-storybook-catalog'))

    // Should list standard atoms
    expect(screen.getByTestId('catalog-atom-SiteButton')).toBeTruthy()
    expect(screen.getByTestId('catalog-atom-SiteText')).toBeTruthy()

    // Search filter
    const searchInput = screen.getByTestId('storybook-catalog-search-input')
    fireEvent.change(searchInput, { target: { value: 'Button' } })

    expect(screen.getByTestId('catalog-atom-SiteButton')).toBeTruthy()
    expect(screen.queryByTestId('catalog-atom-SiteImage')).toBeNull()
  })
})
