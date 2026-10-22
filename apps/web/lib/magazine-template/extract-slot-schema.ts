import type {
  CompositionScene,
  MagazineTemplateSlotDef,
  SceneNode,
} from '@zaoly/contracts'

/** Walk scene tree; collect nodes with consumer `props.dataSlot` (not layout `props.slot`). */
export function extractSlotSchema(scene: CompositionScene): MagazineTemplateSlotDef[] {
  const out: MagazineTemplateSlotDef[] = []
  walk(scene.root, out)
  return out
}

function walk(node: SceneNode, out: MagazineTemplateSlotDef[]): void {
  const raw = node.props?.dataSlot
  if (typeof raw === 'string' && raw.trim() !== '') {
    out.push({
      dataSlot: raw.trim(),
      nodeId: node.id,
      nodeType: node.type,
    })
  }
  for (const child of node.children ?? []) walk(child, out)
}
