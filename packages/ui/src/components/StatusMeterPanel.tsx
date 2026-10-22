import type { HTMLAttributes, ReactNode } from 'react'
import { Panel } from './Panel'
import { Text } from './Text'
import { SectionChrome } from '../SectionChrome'

export type StatusMeterLevel = 'ok' | 'warn' | 'critical'

export type StatusMeterItem = {
  id: string
  label: ReactNode
  value: ReactNode
  fillPct: number
  meta?: ReactNode
}

export type StatusMeterPanelProps = {
  title: string
  meta?: ReactNode
  level?: StatusMeterLevel
  banner: ReactNode
  meters: StatusMeterItem[]
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function StatusMeterPanel({ title, meta, level = 'ok', banner, meters, className, ...rest }: StatusMeterPanelProps) {
  return (
    <Panel variant="default" className={cx('system-load', className)} data-level={level} {...rest}>
      <SectionChrome quiet title={title} meta={meta} />
      <div className={`system-banner level-${level}`} role="status">
        <strong>{banner}</strong>
      </div>
      <div className="grid-three">
        {meters.map((meter) => (
          <div key={meter.id} className="meter">
            <div className="meter-head">
              <span>{meter.label}</span>
              <strong>{meter.value}</strong>
            </div>
            <div className="meter-track" aria-hidden>
              <div className="meter-fill" style={{ width: `${Math.max(meter.fillPct, meter.fillPct > 0 ? 2 : 0)}%` }} />
            </div>
            {meter.meta != null ? <Text role="meta" as="p">{meter.meta}</Text> : null}
          </div>
        ))}
      </div>
    </Panel>
  )
}
