/** Stable peer color from userId (P114). */

const PEER_PALETTE = [
  '#0d9488',
  '#2563eb',
  '#c2410c',
  '#7c3aed',
  '#b45309',
  '#be123c',
  '#0369a1',
  '#15803d',
] as const

export function presenceColorForUserId(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return PEER_PALETTE[hash % PEER_PALETTE.length]!
}
