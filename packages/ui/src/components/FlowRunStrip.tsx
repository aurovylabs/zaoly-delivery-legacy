import type { HTMLAttributes, ReactNode } from 'react'

export type FlowRunStripProps = {
  status?: ReactNode
  meta?: ReactNode
  links?: ReactNode
  verdict?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Live-run strip chrome (place inside FloatingPanel strip). */
export function FlowRunStrip({
  status,
  meta,
  links,
  verdict,
  className,
  ...rest
}: FlowRunStripProps) {
  return (
    <div className={cx('zaoly-flow-run-strip', className)} {...rest}>
      {(status || meta) && (
        <div className="zaoly-flow-run-strip-status">
          {status}
          {meta}
        </div>
      )}
      {links ? <div className="zaoly-flow-run-strip-links">{links}</div> : null}
      {verdict ? <div className="zaoly-flow-run-strip-verdict">{verdict}</div> : null}
    </div>
  )
}
