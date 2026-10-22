/** Normalize / validate emails for Client Page Share allowlists. */

export function normalizeShareEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase()
  if (!email || email.length > 254) return null
  // Practical allowlist check — not full RFC.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export function normalizeShareEmailList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const n = normalizeShareEmail(item)
    if (!n || seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out
}

export function emailOnAllowlist(email: string, allowlist: string[]): boolean {
  const n = normalizeShareEmail(email)
  if (!n) return false
  return allowlist.includes(n)
}
