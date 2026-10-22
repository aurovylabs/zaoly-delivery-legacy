import { Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'
import {
  normalizePrintStepsEmphasisIndex,
  normalizePrintStepsOrientation,
  type PrintStepsOrientation,
} from '../magazine/steps'

export type { PrintStepsOrientation }

export type MagStepItem = {
  label: string
  detail?: string
}

type MagStepsProps = {
  steps: MagStepItem[]
  orientation?: PrintStepsOrientation
  /** 0-based; out of range → no emphasis */
  emphasisIndex?: number
}

/** Linear numbered process — Mag twin of PrintSteps (P92). */
export function MagSteps({ steps, orientation, emphasisIndex }: MagStepsProps) {
  const { styles, colors } = useMagTheme()
  const resolved = normalizePrintStepsOrientation(orientation)
  const emphasis = normalizePrintStepsEmphasisIndex(emphasisIndex, steps.length)
  const row =
    resolved === 'vertical'
      ? styles.stepsVertical
      : styles.stepsHorizontal
  return (
    <View style={row} wrap={false}>
      {steps.map((step, i) => {
        const on = emphasis === i
        return (
          <View
            key={`${step.label}-${i}`}
            style={[
              styles.stepsItem,
              resolved === 'horizontal' ? styles.stepsItemHorizontal : undefined,
              on ? styles.stepsItemEmphasis : undefined,
            ]}
          >
            <View
              style={[
                styles.stepsBadge,
                on
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : undefined,
              ]}
            >
              <Text
                style={[
                  styles.stepsBadgeText,
                  on ? { color: colors.paper } : undefined,
                ]}
              >
                {String(i + 1).padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.stepsCopy}>
              <Text style={styles.stepsLabel}>{step.label}</Text>
              {step.detail ? <Text style={styles.stepsDetail}>{step.detail}</Text> : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}
