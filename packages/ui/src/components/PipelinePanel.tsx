import type { HTMLAttributes, ReactNode } from 'react'
import { Panel } from './Panel'
import { SectionChrome } from '../SectionChrome'

export type PipelineLaneTone = 'enrich' | 'embed' | 'ml' | 'rss'
export type PipelineState = 'idle' | 'active' | 'paused' | 'enrich' | 'embed' | 'unknown'

export type PipelineLane = {
  id: string
  label: ReactNode
  value: ReactNode
  fillPct: number
  tone: PipelineLaneTone
  meta?: ReactNode
  onClick?: () => void
  selected?: boolean
}

export type PipelineSlot = {
  label: ReactNode
  value: ReactNode
  state: PipelineState
  fillPct: number
  meta?: ReactNode
}

export type PipelineOperation = {
  id: string
  label: ReactNode
  state: 'idle' | 'active' | 'paused'
  detail: ReactNode
  fillPct?: number
  tone?: PipelineLaneTone
  live?: boolean
  onClick?: () => void
  selected?: boolean
}

export type PipelinePanelProps = {
  title: string
  lanes: PipelineLane[]
  focusSlot?: PipelineSlot
  operations?: PipelineOperation[]
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function PipelinePanel({ title, lanes, focusSlot, operations = [], className, ...rest }: PipelinePanelProps) {
  return (
    <Panel variant="default" className={cx('pipeline-panel', className)} {...rest}>
      <SectionChrome quiet title={title} />
      <div className="pipeline-lanes">
        {lanes.map((lane) => {
          const body = (
            <>
              <span className="pipeline-lane-label">{lane.label}</span>
              <strong className="pipeline-lane-value">{lane.value}</strong>
              <span className="pipeline-lane-track" aria-hidden>
                <span className={`pipeline-lane-fill ${lane.tone}`} style={{ width: `${Math.max(lane.fillPct, lane.fillPct > 0 ? 2 : 0)}%` }} />
              </span>
              {lane.meta != null ? <span className="meta pipeline-lane-meta">{lane.meta}</span> : null}
            </>
          )

          return lane.onClick ? (
            <button key={lane.id} type="button" className={cx('pipeline-lane', lane.selected && 'is-selected')} onClick={lane.onClick}>
              {body}
            </button>
          ) : (
            <div key={lane.id} className={cx('pipeline-lane', lane.selected && 'is-selected')}>
              {body}
            </div>
          )
        })}
            {focusSlot ? (
          <div className="pipeline-lane pipeline-lane-ml" role="status">
                <span className="pipeline-lane-label">{focusSlot.label}</span>
            <span className="pipeline-lane-value-row">
                  <span className="pipeline-pip" data-state={focusSlot.state} aria-hidden />
                  <strong className="pipeline-lane-value">{focusSlot.value}</strong>
            </span>
            <span className="pipeline-lane-track" aria-hidden>
                  <span className={`pipeline-lane-fill ml${focusSlot.state !== 'idle' && focusSlot.state !== 'unknown' ? ' live' : ''}`} style={{ width: `${Math.max(focusSlot.fillPct, focusSlot.fillPct > 0 ? 2 : 0)}%` }} />
            </span>
                {focusSlot.meta != null ? <span className="meta pipeline-lane-meta">{focusSlot.meta}</span> : null}
          </div>
        ) : null}
      </div>
      {operations.length ? (
        <div className="pipeline-ops">
          {operations.map((op) => {
            const body = (
              <>
                <span className="pipeline-op-head">
                  <span className="pipeline-op-label">{op.label}</span>
                  <span className="pipeline-state" data-state={op.state}>{op.state}</span>
                </span>
                {op.fillPct != null ? (
                  <span className="pipeline-lane-track" aria-hidden>
                    <span className={`pipeline-lane-fill ${op.tone || 'rss'}`} style={{ width: `${Math.max(op.fillPct, op.fillPct > 0 ? 2 : 0)}%` }} />
                  </span>
                ) : null}
                <p className="pipeline-op-detail">{op.detail}</p>
              </>
            )

            return op.onClick ? (
              <button key={op.id} type="button" className={cx('pipeline-op', op.live && 'is-live', op.selected && 'is-selected')} onClick={op.onClick}>
                {body}
              </button>
            ) : (
              <div key={op.id} className={cx('pipeline-op', op.live && 'is-live', op.selected && 'is-selected')}>
                {body}
              </div>
            )
          })}
        </div>
      ) : null}
    </Panel>
  )
}
