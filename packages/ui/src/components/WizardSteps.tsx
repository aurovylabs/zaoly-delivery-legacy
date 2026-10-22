import type { HTMLAttributes } from 'react'
import { LedeStrip, type LedeStep, type LedeStripProps } from './Lede'

export type WizardStep = LedeStep

export type WizardStepsProps = {
  steps: LedeStep[]
  activeIndex: number
  className?: string
  onStepSelect?: (index: number) => void
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children' | 'onSelect'>

/**
 * @deprecated Prefer `<LedeStrip variant="steps" … />` — thin alias for cutover.
 * Spec: specs/domain/zaoly-ui-lede.md
 */
export function WizardSteps({
  steps,
  activeIndex,
  className,
  onStepSelect,
  ...rest
}: WizardStepsProps) {
  const stripProps: LedeStripProps = {
    variant: 'steps',
    steps,
    activeIndex,
    className,
    onStepSelect,
    ...rest,
  }
  return <LedeStrip {...stripProps} />
}
