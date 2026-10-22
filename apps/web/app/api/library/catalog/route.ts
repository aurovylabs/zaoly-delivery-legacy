import { NextResponse } from 'next/server'
import { getLibraryCatalog } from '../../../../lib/fixtures/library-catalog'
import type { LibraryComponentSummary } from '@zaoly/contracts'


/** Public fixture catalog for MCP / clients — Spec `specs/api/catalog.md`. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase()
  const category = url.searchParams.get('category')?.trim()
  const catalog = getLibraryCatalog()
  let items: LibraryComponentSummary[] = catalog.items
  if (category) {
    items = items.filter((row) => row.category === category)
  }
  if (q) {
    items = items.filter((row) => row.tagName.toLowerCase().includes(q))
  }
  return NextResponse.json({
    ...catalog,
    items,
  })
}
