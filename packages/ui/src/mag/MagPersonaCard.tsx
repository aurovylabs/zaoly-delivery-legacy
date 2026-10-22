import { Text, View } from '@react-pdf/renderer'
import { MagChip, MagChipRow } from './MagChip'
import { MagRankedList } from './MagRankedList'
import { MagTraitBars, type MagTrait } from './MagTraitBars'
import { MagTwoColumn } from './MagTwoColumn'
import { useMagTheme } from './MagTheme'

/** Generic persona card model — apps map domain types into this shape. */
export type MagPersonaCardModel = {
  id?: string
  name: string
  segment?: string
  /** 0–1 or 0–100 */
  confidence: number
  bio?: string
  headline?: string
  traits: MagTrait[]
  goals: string[]
  painPoints: string[]
}

export type MagPersonaCardLabels = {
  confidence: string
  goals: string
  painPoints: string
}

const DEFAULT_LABELS: MagPersonaCardLabels = {
  confidence: 'confidence',
  goals: 'Goals',
  painPoints: 'Pain points',
}

type MagPersonaCardProps = {
  persona: MagPersonaCardModel
  labels?: Partial<MagPersonaCardLabels>
  /** Full-width card (single persona) vs half-width tile in a grid. */
  spread?: boolean
  /** Parent already applied personaCell padding/border. */
  bare?: boolean
}

export function MagPersonaCard({
  persona,
  labels: labelOverrides,
  spread = false,
  bare = false,
}: MagPersonaCardProps) {
  const { styles } = useMagTheme()
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const confidence = Math.round(
    persona.confidence <= 1 ? persona.confidence * 100 : persona.confidence,
  )
  const traits = persona.traits.slice(0, spread ? 6 : 4)
  const goals = persona.goals.slice(0, spread ? 6 : 3).map((g) => ({ label: g }))
  const pains = persona.painPoints.slice(0, spread ? 6 : 3).map((g) => ({ label: g }))

  const shell = spread ? styles.personaSpread : bare ? { width: '100%' as const } : styles.personaCell

  return (
    <View style={shell}>
      <Text style={styles.personaName}>{persona.name}</Text>
      <MagChipRow>
        {persona.segment ? <MagChip>{persona.segment}</MagChip> : null}
        <MagChip>
          {confidence}% {labels.confidence}
        </MagChip>
      </MagChipRow>
      {persona.bio || persona.headline ? (
        <Text style={styles.personaBio}>{persona.bio || persona.headline}</Text>
      ) : null}
      {traits.length > 0 ? <MagTraitBars traits={traits} compact /> : null}
      {spread && (goals.length > 0 || pains.length > 0) ? (
        <View style={{ marginTop: 14, width: '100%' }}>
          <MagTwoColumn
            left={
              goals.length > 0 ? (
                <View style={{ width: '100%' }}>
                  <Text style={styles.subEyebrow}>{labels.goals}</Text>
                  <MagRankedList items={goals} compact />
                </View>
              ) : (
                <View />
              )
            }
            right={
              pains.length > 0 ? (
                <View style={{ width: '100%' }}>
                  <Text style={styles.subEyebrow}>{labels.painPoints}</Text>
                  <MagRankedList items={pains} compact />
                </View>
              ) : (
                <View />
              )
            }
          />
        </View>
      ) : null}
      {!spread && goals.length > 0 ? (
        <View style={{ marginTop: 10, width: '100%' }}>
          <Text style={styles.subEyebrow}>{labels.goals}</Text>
          <MagRankedList items={goals} compact />
        </View>
      ) : null}
    </View>
  )
}
