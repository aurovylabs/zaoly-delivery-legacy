/**
 * Path-addressed Site Kit composition helpers (SK-V17).
 * Paths are child index arrays: `[]` = root, `[0,1]` = first child’s second child.
 * Spec: `specs/domain/site-kit-playground.md`
 */
import type { SiteKitCompositionNode } from '@zaoly/site-kit'

export type CompositionPath = readonly number[]

export type CompositionOutlineEntry = {
  path: number[]
  type: string
  depth: number
  label: string
}

export function pathsEqual(a: CompositionPath, b: CompositionPath): boolean {
  if (a.length !== b.length) return false
  return a.every((n, i) => n === b[i])
}

export function formatCompositionPath(path: CompositionPath): string {
  if (path.length === 0) return 'root'
  return `root › ${path.join(' › ')}`
}

export function getNodeAtPath(
  root: SiteKitCompositionNode | null | undefined,
  path: CompositionPath,
): SiteKitCompositionNode | null {
  if (!root) return null
  let node: SiteKitCompositionNode = root
  for (const index of path) {
    const child = node.children?.[index]
    if (!child) return null
    node = child
  }
  return node
}

export function updateNodeAtPath(
  root: SiteKitCompositionNode,
  path: CompositionPath,
  updater: (node: SiteKitCompositionNode) => SiteKitCompositionNode,
): SiteKitCompositionNode {
  if (path.length === 0) return updater(root)
  const [head, ...rest] = path
  if (head == null || !root.children || !root.children[head]) return root
  const nextChildren = root.children.map((child, i) =>
    i === head ? updateNodeAtPath(child, rest, updater) : child,
  )
  return { ...root, children: nextChildren }
}

export function listCompositionOutline(
  root: SiteKitCompositionNode | null | undefined,
): CompositionOutlineEntry[] {
  if (!root) return []
  const out: CompositionOutlineEntry[] = []
  const walk = (node: SiteKitCompositionNode, path: number[], depth: number) => {
    out.push({
      path: [...path],
      type: node.type,
      depth,
      label: path.length === 0 ? node.type : `${node.type} [${path.join('.')}]`,
    })
    node.children?.forEach((child, i) => walk(child, [...path, i], depth + 1))
  }
  walk(root, [], 0)
  return out
}
