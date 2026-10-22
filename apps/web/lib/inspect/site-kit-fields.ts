/**
 * Typed inspect fields for Site Kit atoms (editor write surface).
 * Composites are nested trees — edit child layers, not flat shell props.
 * Spec: `specs/domain/site-kit.md`
 */
import type { ContractPropDef } from '@zaoly/contracts'
import {
  MEDIA_LOADING_OPTIONS,
  OBJECT_FIT_OPTIONS,
  OBJECT_POSITION_OPTIONS,
} from '@zaoly/contracts'
import {
  SITE_SVG_DEFAULT_MARK_ID,
  SITE_SVG_PLACEHOLDER_MARKUP,
  siteSvgMarkOptions,
} from '@zaoly/site-kit'
import { isSiteKitInsertableType } from '../scene/site-kit-palette'

const DIRECTION: ContractPropDef = {
  name: 'direction',
  label: 'Direction',
  kind: 'enum',
  section: 'layout',
  options: [
    { value: 'column', label: 'Column' },
    { value: 'row', label: 'Row' },
  ],
  defaultValue: 'column',
  control: 'segmented',
}

/** Layout gap ladder + token pack space leaves (paint → CSS; stripped from contract props). */
const GAP: ContractPropDef = {
  name: 'gap',
  label: 'Gap',
  kind: 'token',
  section: 'layout',
  tokenGroup: 'space',
}

const WRAP: ContractPropDef = {
  name: 'wrap',
  label: 'Wrap',
  kind: 'boolean',
  section: 'layout',
  defaultValue: 'false',
  control: 'segmented',
}

const COLUMNS: ContractPropDef = {
  name: 'columns',
  label: 'Columns',
  kind: 'enum',
  section: 'layout',
  options: [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
  ],
  defaultValue: '2',
  control: 'segmented',
}

const SITE_KIT_PROPS: Record<string, ContractPropDef[]> = {
  SiteButton: [
    // No seed variant enum (primary/secondary/ghost) — Master named variants + paint.
    { name: 'children', label: 'Label', kind: 'string', section: 'component', defaultValue: 'Button' },
  ],
  SiteText: [
    {
      name: 'role',
      label: 'Role',
      kind: 'enum',
      section: 'component',
      options: [
        { value: 'display', label: 'Display' },
        { value: 'title', label: 'Title' },
        { value: 'body', label: 'Body' },
        { value: 'label', label: 'Label' },
      ],
      defaultValue: 'body',
      control: 'segmented',
    },
    { name: 'children', label: 'Text', kind: 'string', section: 'component', defaultValue: 'Text' },
  ],
  SiteLink: [
    { name: 'children', label: 'Label', kind: 'string', section: 'component', defaultValue: 'Link' },
    { name: 'href', label: 'Href', kind: 'string', section: 'component', defaultValue: '#' },
  ],
  SiteStack: [DIRECTION, GAP, WRAP],
  SiteContainer: [DIRECTION, GAP, WRAP],
  SiteGrid: [COLUMNS, GAP],
  SiteBadge: [
    { name: 'children', label: 'Label', kind: 'string', section: 'component', defaultValue: 'Badge' },
  ],
  SiteChart: [
    {
      name: 'chartType',
      label: 'Chart type',
      kind: 'enum',
      section: 'component',
      options: [
        { value: 'bar', label: 'Bar' },
        { value: 'bar_horizontal', label: 'Bar horizontal' },
        { value: 'line', label: 'Line' },
        { value: 'area', label: 'Area' },
        { value: 'scatter', label: 'Scatter' },
        { value: 'pie', label: 'Pie' },
        { value: 'donut', label: 'Donut' },
        { value: 'funnel', label: 'Funnel' },
      ],
      defaultValue: 'bar',
      // Select — not named `variant` (Master variant-axis collision made writes snap back).
    },
    { name: 'title', label: 'Title', kind: 'string', section: 'component' },
    { name: 'height', label: 'Height (px)', kind: 'string', section: 'component', defaultValue: '220' },
    {
      name: 'data',
      label: 'Series (label: value per line)',
      kind: 'string',
      section: 'component',
      defaultValue: 'A: 42\nB: 28\nC: 65\nD: 18',
    },
  ],
  SiteGauge: [
    { name: 'label', label: 'Label', kind: 'string', section: 'component' },
    { name: 'unit', label: 'Unit', kind: 'string', section: 'component' },
    { name: 'value', label: 'Value', kind: 'string', section: 'component', defaultValue: '72' },
    { name: 'min', label: 'Min', kind: 'string', section: 'component', defaultValue: '0' },
    { name: 'max', label: 'Max', kind: 'string', section: 'component', defaultValue: '100' },
    {
      name: 'tone',
      label: 'Tone',
      kind: 'enum',
      section: 'component',
      options: [
        { value: 'neutral', label: 'neutral' },
        { value: 'ok', label: 'ok' },
        { value: 'warn', label: 'warn' },
        { value: 'bad', label: 'bad' },
      ],
      defaultValue: 'neutral',
      control: 'segmented',
    },
  ],
  SiteImage: [
    {
      name: 'src',
      label: 'Image src',
      kind: 'string',
      section: 'component',
      defaultValue: 'https://placehold.co/320x180',
    },
    { name: 'alt', label: 'Alt text', kind: 'string', section: 'component', defaultValue: 'Image' },
    {
      name: 'objectFit',
      label: 'Fit',
      kind: 'enum',
      section: 'component',
      options: OBJECT_FIT_OPTIONS,
      defaultValue: 'cover',
      control: 'segmented',
    },
    {
      name: 'objectPosition',
      label: 'Position',
      kind: 'enum',
      section: 'component',
      options: OBJECT_POSITION_OPTIONS,
      defaultValue: 'center',
      control: 'segmented',
    },
    {
      name: 'loading',
      label: 'Loading',
      kind: 'enum',
      section: 'component',
      options: MEDIA_LOADING_OPTIONS,
      defaultValue: 'lazy',
      control: 'segmented',
    },
  ],
  SiteSvg: [
    {
      name: 'mark',
      label: 'Mark',
      kind: 'enum',
      section: 'component',
      options: siteSvgMarkOptions(),
      defaultValue: SITE_SVG_DEFAULT_MARK_ID,
      control: 'select',
    },
    {
      name: 'markup',
      label: 'Replace SVG',
      kind: 'string',
      section: 'component',
      defaultValue: SITE_SVG_PLACEHOLDER_MARKUP,
    },
    { name: 'viewBox', label: 'ViewBox', kind: 'string', section: 'component' },
    { name: 'alt', label: 'Alt text', kind: 'string', section: 'component', defaultValue: 'Graphic' },
    { name: 'title', label: 'Title', kind: 'string', section: 'component' },
  ],
  SiteShape: [
    {
      name: 'd',
      label: 'Path d',
      kind: 'string',
      section: 'component',
      defaultValue: 'M24 4 L44 24 L24 44 L4 24 Z',
    },
    {
      name: 'viewBox',
      label: 'ViewBox',
      kind: 'string',
      section: 'component',
      defaultValue: '0 0 48 48',
    },
    { name: 'alt', label: 'Alt text', kind: 'string', section: 'component', defaultValue: 'Shape' },
    { name: 'title', label: 'Title', kind: 'string', section: 'component' },
  ],
  SiteInput: [
    { name: 'placeholder', label: 'Placeholder', kind: 'string', section: 'component' },
  ],
  SiteTextarea: [
    { name: 'placeholder', label: 'Placeholder', kind: 'string', section: 'component' },
  ],
  SiteSelect: [
    { name: 'placeholder', label: 'Placeholder', kind: 'string', section: 'component' },
    {
      name: 'options',
      label: 'Options',
      kind: 'string',
      section: 'component',
      defaultValue: 'Option A\nOption B',
    },
  ],
  SiteCheckbox: [
    { name: 'children', label: 'Label', kind: 'string', section: 'component', defaultValue: 'Remember me' },
  ],
  SiteDivider: [],
  SiteTable: [
    {
      name: 'density',
      label: 'Density',
      kind: 'enum',
      section: 'component',
      options: [
        { value: 'compact', label: 'Compact' },
        { value: 'default', label: 'Default' },
        { value: 'comfortable', label: 'Comfortable' },
      ],
      defaultValue: 'default',
      control: 'segmented',
    },
    {
      name: 'borders',
      label: 'Borders',
      kind: 'enum',
      section: 'component',
      options: [
        { value: 'none', label: 'None' },
        { value: 'row', label: 'Row' },
        { value: 'all', label: 'All' },
      ],
      defaultValue: 'row',
      control: 'segmented',
    },
    {
      name: 'striped',
      label: 'Striped',
      kind: 'boolean',
      section: 'component',
      defaultValue: 'false',
      control: 'segmented',
    },
    {
      name: 'caption',
      label: 'Caption',
      kind: 'string',
      section: 'component',
    },
  ],
  SiteTableRow: [
    {
      name: 'header',
      label: 'Header row',
      kind: 'boolean',
      section: 'component',
      defaultValue: 'false',
      control: 'segmented',
    },
  ],
  SiteTableCell: [
    {
      name: 'header',
      label: 'Header cell',
      kind: 'boolean',
      section: 'component',
      defaultValue: 'false',
      control: 'segmented',
    },
    {
      name: 'align',
      label: 'Align',
      kind: 'enum',
      section: 'component',
      options: [
        { value: 'start', label: 'Start' },
        { value: 'center', label: 'Center' },
        { value: 'end', label: 'End' },
      ],
      defaultValue: 'start',
      control: 'segmented',
    },
  ],
}

export function siteKitContractProps(type: string): ContractPropDef[] {
  if (!isSiteKitInsertableType(type)) return []
  return SITE_KIT_PROPS[type] ?? []
}

export function hasSiteKitContract(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(SITE_KIT_PROPS, type)
}
