import type { HTMLAttributes, ReactNode } from 'react'

export type FlowNodeRunState = 'idle' | 'active' | 'done' | 'skipped' | 'error'

export type FlowNodeCardProps = {
  kind: string
  kindLabel?: string
  nodeId?: string
  selected?: boolean
  runState?: FlowNodeRunState
  runStateB?: FlowNodeRunState
  hasOutput?: boolean
  /** App-owned target Handle(s). */
  targetHandle?: ReactNode
  /** App-owned source Handle(s). */
  sourceHandles?: ReactNode
  children?: ReactNode
  output?: ReactNode
  footer?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Magazine RF node card chrome — no xyflow dependency; handles via slots. */
export function FlowNodeCard({
  kind,
  kindLabel,
  nodeId,
  selected,
  runState = 'idle',
  runStateB = 'idle',
  hasOutput,
  targetHandle,
  sourceHandles,
  children,
  output,
  footer,
  className,
  ...rest
}: FlowNodeCardProps) {
  return (
    <div
      className={cx(
        'zaoly-flow-rf-node',
        `zaoly-flow-rf-node--${kind}`,
        `zaoly-flow-rf-node--run-${runState}`,
        runStateB !== 'idle' && `zaoly-flow-rf-node--run-b-${runStateB}`,
        hasOutput && 'has-output',
        selected && 'is-selected',
        className
      )}
      data-kind={kind}
      data-run={runState}
      {...rest}
    >
      {targetHandle}
      <header className="zaoly-flow-rf-node-head">
        <span className="zaoly-flow-rf-node-kind">{kindLabel ?? kind}</span>
        <span className="zaoly-flow-rf-node-run" data-run={runState}>
          {runState === 'idle' ? '' : runState}
        </span>
        {nodeId ? (
          <span className="zaoly-flow-rf-node-id" title={nodeId}>
            {nodeId}
          </span>
        ) : null}
      </header>
      <div className="zaoly-flow-rf-node-body">{children}</div>
      {output ? <div className="zaoly-flow-rf-output">{output}</div> : null}
      {footer ? <div className="zaoly-flow-rf-footer">{footer}</div> : null}
      {sourceHandles}
    </div>
  )
}
