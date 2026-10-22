import { Path, Svg } from '@react-pdf/renderer'
import { magColors } from '@zaoly/ui/mag'
import { paths } from '../paths'

/** App-injected MagPage logo — SVG path from `paths` (no Coolify URL). */
export function ZaolyLogoPdf({
  width = paths.zaolyLogoPdfDefaultWidth,
  height = paths.zaolyLogoPdfDefaultHeight,
  color = magColors.ink,
}: {
  width?: number
  height?: number
  color?: string
}) {
  return (
    <Svg viewBox={paths.zaolyLogoPdfViewBox} width={width} height={height}>
      <Path d={paths.zaolyLogoPdfPathD} fill={color} />
    </Svg>
  )
}
