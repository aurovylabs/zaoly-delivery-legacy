import type { SiteKitCompositionNode } from '@zaoly/site-kit'
import { SITE_KIT_CATALOG } from '../site-kit/site-kit-catalog'

/** Minimal demo trees for Library atom card previews (spec: library-hub.md). */
export const SITE_KIT_ATOM_PREVIEW_NODES: Record<string, SiteKitCompositionNode> = {
  SiteButton: {
    type: 'SiteButton',
    props: { children: 'Button', type: 'button', disabled: true },
  },
  SiteText: {
    type: 'SiteText',
    props: { children: 'Body text', role: 'body' },
  },
  SiteLink: {
    type: 'SiteLink',
    props: { children: 'Learn more', href: '#' },
  },
  SiteInput: {
    type: 'SiteInput',
    props: { placeholder: 'Input', defaultValue: 'Value', disabled: true },
  },
  SiteTextarea: {
    type: 'SiteTextarea',
    props: { placeholder: 'Textarea', defaultValue: 'Multiline', rows: 2, disabled: true },
  },
  SiteSelect: {
    type: 'SiteSelect',
    props: { options: 'Option A\nOption B', defaultValue: 'Option A', disabled: true },
  },
  SiteCheckbox: {
    type: 'SiteCheckbox',
    props: { children: 'Remember me', defaultChecked: true, disabled: true },
  },
  SiteBadge: {
    type: 'SiteBadge',
    props: { children: 'Badge' },
  },
  SiteChart: {
    type: 'SiteChart',
    props: {
      chartType: 'bar',
      variant: 'bar',
      title: 'Chart',
      height: 140,
      data: 'A: 40\nB: 28\nC: 55',
    },
    style: { width: '100%' },
  },
  SiteGauge: {
    type: 'SiteGauge',
    props: { value: 72, min: 0, max: 100, label: 'Score', unit: '%', tone: 'ok' },
    style: { width: '100%', maxWidth: '8rem' },
  },
  SiteImage: {
    type: 'SiteImage',
    props: { alt: 'Preview' },
    style: { maxWidth: '100%', height: 'auto' },
  },
  SiteSvg: {
    type: 'SiteSvg',
    props: { alt: 'Graphic' },
    style: { width: '2.5rem', height: '2.5rem' },
  },
  SiteShape: {
    type: 'SiteShape',
    props: { alt: 'Shape' },
    style: { width: '2.5rem', height: '2.5rem' },
  },
  SiteContainer: {
    type: 'SiteContainer',
    props: {},
    style: { gap: '0.35rem', width: '100%', padding: '0.25rem' },
    children: [
      { type: 'SiteButton', props: { children: 'Action', type: 'button', disabled: true } },
      { type: 'SiteText', props: { children: 'Caption', role: 'label' } },
    ],
  },
  SiteStack: {
    type: 'SiteStack',
    props: {},
    style: { gap: '0.35rem', width: '100%' },
    children: [
      { type: 'SiteText', props: { children: 'Line one', role: 'label' } },
      { type: 'SiteText', props: { children: 'Line two', role: 'body' } },
    ],
  },
  SiteGrid: {
    type: 'SiteGrid',
    props: {},
    style: { gridTemplateColumns: '1fr 1fr', gap: '0.35rem', width: '100%' },
    children: [
      { type: 'SiteBadge', props: { children: 'A' } },
      { type: 'SiteBadge', props: { children: 'B' } },
      { type: 'SiteBadge', props: { children: 'C' } },
      { type: 'SiteBadge', props: { children: 'D' } },
    ],
  },
  SiteDivider: {
    type: 'SiteDivider',
    props: {},
    style: { width: '100%', margin: '0.5rem 0' },
  },
  SiteTable: {
    type: 'SiteTable',
    props: { density: 'compact', borders: 'row', caption: 'Table' },
    style: { width: '100%' },
    children: [
      {
        type: 'SiteTableRow',
        props: { header: true },
        children: [
          {
            type: 'SiteTableCell',
            props: { header: true },
            children: [{ type: 'SiteText', props: { children: 'A', role: 'label' } }],
          },
          {
            type: 'SiteTableCell',
            props: { header: true },
            children: [{ type: 'SiteText', props: { children: 'B', role: 'label' } }],
          },
        ],
      },
      {
        type: 'SiteTableRow',
        props: {},
        children: [
          {
            type: 'SiteTableCell',
            props: {},
            children: [{ type: 'SiteText', props: { children: '1', role: 'body' } }],
          },
          {
            type: 'SiteTableCell',
            props: {},
            children: [{ type: 'SiteText', props: { children: '2', role: 'body' } }],
          },
        ],
      },
    ],
  },
  /** Row/cell must sit in a table — bare <tr>/<td> in a div hydrates as invalid HTML. */
  SiteTableRow: {
    type: 'SiteTable',
    props: { density: 'compact', borders: 'row' },
    style: { width: '100%' },
    children: [
      {
        type: 'SiteTableRow',
        props: {},
        children: [
          {
            type: 'SiteTableCell',
            props: {},
            children: [{ type: 'SiteText', props: { children: 'Cell', role: 'body' } }],
          },
          {
            type: 'SiteTableCell',
            props: {},
            children: [{ type: 'SiteText', props: { children: 'Cell', role: 'body' } }],
          },
        ],
      },
    ],
  },
  SiteTableCell: {
    type: 'SiteTable',
    props: { density: 'compact', borders: 'row' },
    style: { width: '100%' },
    children: [
      {
        type: 'SiteTableRow',
        props: {},
        children: [
          {
            type: 'SiteTableCell',
            props: {},
            children: [{ type: 'SiteText', props: { children: 'Cell', role: 'body' } }],
          },
        ],
      },
    ],
  },
}

export function siteKitAtomPreviewNode(atomId: string): SiteKitCompositionNode | null {
  return SITE_KIT_ATOM_PREVIEW_NODES[atomId] ?? null
}

/** Every catalog atom must have a preview node (CI guard). */
export function assertSiteKitAtomPreviewCoverage(): void {
  for (const entry of SITE_KIT_CATALOG) {
    if (!SITE_KIT_ATOM_PREVIEW_NODES[entry.id]) {
      throw new Error(`Missing library preview node for ${entry.id}`)
    }
  }
}

assertSiteKitAtomPreviewCoverage()
