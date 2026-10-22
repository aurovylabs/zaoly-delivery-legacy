import type { ComponentType, CSSProperties, MouseEvent, ReactNode } from 'react'
import { isAllowedSiteKitProp } from '../composition-codegen/contracts'
import { Badge } from './Badge'
import { Button } from './Button'
import { Chart } from './Chart'
import { Checkbox } from './Checkbox'
import { Container } from './Container'
import { Divider } from './Divider'
import { Gauge } from './Gauge'
import { Grid } from './Grid'
import { Image } from './Image'
import { Input } from './Input'
import { Link } from './Link'
import { Select } from './Select'
import { Stack } from './Stack'
import { Svg } from './Svg'
import { Table, TableCell, TableRow } from './Table'
import { Text } from './Text'
import { Textarea } from './Textarea'

/** Serialized CREATION Site Kit tree (tokens already resolved to CSS). */
export type SiteKitCompositionNode = {
  type: string
  name?: string
  /** Optional — codegen / Master trees may omit empty props; preview defaults to {}. */
  props?: Record<string, unknown>
  style?: Record<string, string | number>
  tokenBindings?: Record<string, string>
  children?: SiteKitCompositionNode[]
}

function contractPropsOnly(
  type: string,
  props: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'slot' || key === 'children') continue
    if (!isAllowedSiteKitProp(type, key)) continue
    out[key] = value
  }
  return out
}

function pathsEqual(a: readonly number[] | undefined, b: readonly number[]): boolean {
  if (!a || a.length !== b.length) return false
  return a.every((n, i) => n === b[i])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, ComponentType<any>> = {
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
  SiteContainer: Container,
  SiteStack: Stack,
  SiteGrid: Grid,
  SiteDivider: Divider,
  SiteTable: Table,
  SiteTableRow: TableRow,
  SiteTableCell: TableCell,
}

function CompositionPreviewNode({
  node,
  path,
  selectedPath,
  onSelectPath,
}: {
  node: SiteKitCompositionNode
  path: number[]
  selectedPath?: readonly number[]
  onSelectPath?: (path: number[]) => void
}): ReactNode {
  const Comp = REGISTRY[node.type]
  const childNodes = node.children?.map((child, i) => (
    <CompositionPreviewNode
      key={`${child.type}-${i}`}
      node={child}
      path={[...path, i]}
      selectedPath={selectedPath}
      onSelectPath={onSelectPath}
    />
  ))
  const selected = pathsEqual(selectedPath, path)
  const style: CSSProperties = {
    ...((node.style ?? {}) as CSSProperties),
    ...(selected
      ? {
          outline: '2px solid color-mix(in srgb, #2563eb 70%, transparent)',
          outlineOffset: 2,
        }
      : null),
  }
  const props = contractPropsOnly(node.type, { ...(node.props ?? {}) })
  const textChildren = node.props?.children
  delete props.children

  // Layout may live only on `style` (Storyblok layout snapshot / serialize).
  // Stack/Container need `direction` for `--row` class + wrap defaults.
  if (
    (node.type === 'SiteStack' || node.type === 'SiteContainer') &&
    props.direction == null &&
    (node.style?.flexDirection === 'row' || node.props?.direction === 'row')
  ) {
    props.direction = 'row'
  }

  const selectHandlers =
    onSelectPath != null
      ? {
          onClick: (event: MouseEvent) => {
            event.stopPropagation()
            onSelectPath(path)
          },
          'data-kit-path': path.length === 0 ? 'root' : path.join('.'),
          'data-kit-selected': selected ? 'true' : undefined,
        }
      : {}

  if (!Comp) {
    return <>{childNodes}</>
  }

  if (childNodes && childNodes.length > 0) {
    return (
      <Comp {...props} style={style} {...selectHandlers}>
        {childNodes}
      </Comp>
    )
  }

  if (textChildren == null || textChildren === '') {
    return <Comp {...props} style={style} {...selectHandlers} />
  }

  return (
    <Comp {...props} style={style} {...selectHandlers}>
      {textChildren as ReactNode}
    </Comp>
  )
}

/**
 * Render a CREATION-exported Site Kit composition in Storybook / Kit.
 * Children-first shells; leaf text/labels come from `props.children`.
 * Optional path select (SK-V17) for Kit Props tree targeting.
 */
export function CompositionPreview({
  node,
  selectedPath,
  onSelectPath,
}: {
  node: SiteKitCompositionNode
  selectedPath?: readonly number[]
  onSelectPath?: (path: number[]) => void
}): ReactNode {
  return (
    <CompositionPreviewNode
      node={node}
      path={[]}
      selectedPath={selectedPath}
      onSelectPath={onSelectPath}
    />
  )
}
