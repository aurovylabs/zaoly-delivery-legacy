/**
 * Map SceneNode.type (Site*) → React component from @zaoly/site-kit.
 * Spec: `specs/domain/site-kit.md`
 */
import type { ComponentType } from 'react'
import {
  Badge,
  Button,
  Chart,
  Checkbox,
  Container,
  Divider,
  Gauge,
  Grid,
  Image,
  Input,
  Link,
  Select,
  Stack,
  Svg,
  Shape,
  Text,
  Textarea,
  Table,
  TableCell,
  TableRow,
} from '@zaoly/site-kit'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComp = ComponentType<any>

const REGISTRY: Record<string, AnyComp> = {
  SiteButton: Button,
  SiteText: Text,
  SiteLink: Link,
  SiteInput: Input,
  SiteTextarea: Textarea,
  SiteSelect: Select,
  SiteCheckbox: Checkbox,
  SiteBadge: Badge,
  SiteChart: Chart,
  SiteGauge: Gauge,
  SiteImage: Image,
  SiteSvg: Svg,
  SiteShape: Shape,
  SiteContainer: Container,
  SiteStack: Stack,
  SiteGrid: Grid,
  SiteDivider: Divider,
  SiteTable: Table,
  SiteTableRow: TableRow,
  SiteTableCell: TableCell,
}

export function siteKitComponent(type: string): AnyComp | undefined {
  return REGISTRY[type]
}
