import type { InspectFieldDef } from './field-catalog'

const POSITION_FIELD_NAMES = new Set([
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
  'aspectRatio',
  'scale',
  'scaleX',
  'scaleY',
  'skewX',
  'skewY',
  'transformOrigin',
])

export type PartitionedPositionFields = {
  positionField: InspectFieldDef | null
  aspectRatioField: InspectFieldDef | null
  zIndexField: InspectFieldDef | null
  coordinateFields: InspectFieldDef[]
  scaleField: InspectFieldDef | null
  transformOriginField: InspectFieldDef | null
  skewFields: InspectFieldDef[]
  rest: InspectFieldDef[]
}

export function partitionInspectPositionFields(
  fields: InspectFieldDef[],
): PartitionedPositionFields {
  let positionField: InspectFieldDef | null = null
  let aspectRatioField: InspectFieldDef | null = null
  let zIndexField: InspectFieldDef | null = null
  let scaleField: InspectFieldDef | null = null
  let transformOriginField: InspectFieldDef | null = null
  const coordinateFields: InspectFieldDef[] = []
  const skewFields: InspectFieldDef[] = []
  const rest: InspectFieldDef[] = []

  for (const field of fields) {
    if (field.name === 'position') {
      positionField = field
    } else if (field.name === 'aspectRatio') {
      aspectRatioField = field
    } else if (field.name === 'zIndex') {
      zIndexField = field
    } else if (field.name === 'scale' || field.name === 'scaleX') {
      scaleField = field
    } else if (field.name === 'transformOrigin') {
      transformOriginField = field
    } else if (field.name === 'skewX' || field.name === 'skewY') {
      skewFields.push(field)
    } else if (
      field.name === 'top' ||
      field.name === 'right' ||
      field.name === 'bottom' ||
      field.name === 'left'
    ) {
      coordinateFields.push(field)
    } else if (field.name === 'scaleY') {
      // Handled with scale
    } else {
      rest.push(field)
    }
  }

  return {
    positionField,
    aspectRatioField,
    zIndexField,
    coordinateFields,
    scaleField,
    transformOriginField,
    skewFields,
    rest,
  }
}
