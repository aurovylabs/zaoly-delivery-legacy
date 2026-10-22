export type SiteKitCatalogEntry = {
  id: string
  exportName: string
  storyFile: string
  title: string
}

/** Closed catalog — atoms + layout only (shells removed; build via Save as composition). */
export const SITE_KIT_CATALOG: readonly SiteKitCatalogEntry[] = [
  { id: 'SiteButton', exportName: 'Button', storyFile: 'src/components/Button.stories.tsx', title: 'Site/Button' },
  { id: 'SiteText', exportName: 'Text', storyFile: 'src/components/Text.stories.tsx', title: 'Site/Text' },
  { id: 'SiteLink', exportName: 'Link', storyFile: 'src/components/Link.stories.tsx', title: 'Site/Link' },
  { id: 'SiteInput', exportName: 'Input', storyFile: 'src/components/Input.stories.tsx', title: 'Site/Input' },
  { id: 'SiteTextarea', exportName: 'Textarea', storyFile: 'src/components/Textarea.stories.tsx', title: 'Site/Textarea' },
  { id: 'SiteSelect', exportName: 'Select', storyFile: 'src/components/Select.stories.tsx', title: 'Site/Select' },
  { id: 'SiteCheckbox', exportName: 'Checkbox', storyFile: 'src/components/Checkbox.stories.tsx', title: 'Site/Checkbox' },
  { id: 'SiteBadge', exportName: 'Badge', storyFile: 'src/components/Badge.stories.tsx', title: 'Site/Badge' },
  { id: 'SiteChart', exportName: 'Chart', storyFile: 'src/components/Chart.stories.tsx', title: 'Site/Chart' },
  { id: 'SiteGauge', exportName: 'Gauge', storyFile: 'src/components/Gauge.stories.tsx', title: 'Site/Gauge' },
  { id: 'SiteImage', exportName: 'Image', storyFile: 'src/components/Image.stories.tsx', title: 'Site/Image' },
  { id: 'SiteSvg', exportName: 'Svg', storyFile: 'src/components/Svg.stories.tsx', title: 'Site/Svg' },
  { id: 'SiteShape', exportName: 'Shape', storyFile: 'src/components/Shape.stories.tsx', title: 'Site/Shape' },
  { id: 'SiteContainer', exportName: 'Container', storyFile: 'src/components/Container.stories.tsx', title: 'Site/Container' },
  { id: 'SiteStack', exportName: 'Stack', storyFile: 'src/components/Stack.stories.tsx', title: 'Site/Stack' },
  { id: 'SiteGrid', exportName: 'Grid', storyFile: 'src/components/Grid.stories.tsx', title: 'Site/Grid' },
  { id: 'SiteDivider', exportName: 'Divider', storyFile: 'src/components/Divider.stories.tsx', title: 'Site/Divider' },
  { id: 'SiteTable', exportName: 'Table', storyFile: 'src/components/Table.stories.tsx', title: 'Site/Table' },
  { id: 'SiteTableRow', exportName: 'TableRow', storyFile: 'src/components/Table.stories.tsx', title: 'Site/Table' },
  { id: 'SiteTableCell', exportName: 'TableCell', storyFile: 'src/components/Table.stories.tsx', title: 'Site/Table' },
] as const
