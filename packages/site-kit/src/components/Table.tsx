import {
  Children,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
} from 'react'

export type SiteTableDensity = 'compact' | 'default' | 'comfortable'
export type SiteTableBorders = 'none' | 'row' | 'all'

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  density?: SiteTableDensity
  borders?: SiteTableBorders
  striped?: boolean | 'true' | 'false'
  caption?: string
  children?: ReactNode
}

function truthy(v: boolean | string | undefined): boolean {
  return v === true || v === 'true'
}

function isTableSection(type: unknown): boolean {
  return type === 'thead' || type === 'tbody' || type === 'tfoot' || type === 'colgroup'
}

/** Browser DOM wraps bare <tr> in <tbody>; React must match to avoid hydration errors. */
function sectionLooseRows(children: ReactNode): ReactNode {
  const items = Children.toArray(children)
  if (items.length === 0) return null
  if (items.some((child) => isValidElement(child) && isTableSection(child.type))) {
    return children
  }

  const headerRows: ReactNode[] = []
  const bodyRows: ReactNode[] = []
  for (const child of items) {
    if (
      isValidElement(child) &&
      truthy((child.props as { header?: boolean | string }).header)
    ) {
      headerRows.push(child)
    } else {
      bodyRows.push(child)
    }
  }

  return (
    <>
      {headerRows.length > 0 ? <thead>{headerRows}</thead> : null}
      {bodyRows.length > 0 ? <tbody>{bodyRows}</tbody> : null}
    </>
  )
}

export function Table({
  density = 'default',
  borders = 'row',
  striped,
  caption,
  className,
  children,
  ...rest
}: TableProps) {
  const classes = [
    'site-table',
    density !== 'default' ? `site-table--${density}` : null,
    borders !== 'row' ? `site-table--borders-${borders}` : 'site-table--borders-row',
    truthy(striped) ? 'site-table--striped' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <table className={classes} {...rest}>
      {caption ? <caption className="site-table__caption">{caption}</caption> : null}
      {sectionLooseRows(children)}
    </table>
  )
}

export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  header?: boolean | 'true' | 'false'
  children?: ReactNode
}

export function TableRow({ header, className, children, ...rest }: TableRowProps) {
  const isHeader = truthy(header)
  return (
    <tr
      className={['site-table-row', isHeader ? 'site-table-row--header' : null, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </tr>
  )
}

export type SiteTableCellAlign = 'start' | 'center' | 'end'

export type TableCellProps = HTMLAttributes<HTMLTableCellElement> & {
  header?: boolean | 'true' | 'false'
  align?: SiteTableCellAlign
  children?: ReactNode
}

export function TableCell({
  header,
  align = 'start',
  className,
  style,
  children,
  ...rest
}: TableCellProps) {
  const isHeader = truthy(header)
  const Tag = isHeader ? 'th' : 'td'
  const merged: CSSProperties = {
    ...(align !== 'start' ? { textAlign: align === 'end' ? 'right' : align } : null),
    ...style,
  }
  return (
    <Tag
      className={[
        'site-table-cell',
        align !== 'start' ? `site-table-cell--${align}` : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={merged}
      {...rest}
    >
      {children}
    </Tag>
  )
}
