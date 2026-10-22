import { NextResponse } from 'next/server'

/** Stable error codes for retired suite surfaces on Zaoly. */
export const SUITE_OUT_OF_SCOPE = 'suite_out_of_scope' as const
export const UPSTREAM_PACK_OUT_OF_SCOPE = 'upstream_pack_out_of_scope' as const
export const PRINT_OUT_OF_SCOPE = 'print_out_of_scope' as const

export function suiteOutOfScopeResponse(detail?: string) {
  return NextResponse.json(
    {
      error: SUITE_OUT_OF_SCOPE,
      detail:
        detail ??
        'Suite federation is out of scope for Zaoly. See knowledge/suite-federation-out-of-scope-for-zaoly.md.',
    },
    { status: 410 },
  )
}

export function upstreamPackOutOfScopeResponse(detail?: string) {
  return NextResponse.json(
    {
      error: UPSTREAM_PACK_OUT_OF_SCOPE,
      detail:
        detail ??
        'Upstream brand packs are out of scope for Zaoly. See knowledge/upstream-pack-out-of-scope-for-zaoly.md.',
      use: '/api/tokens',
    },
    { status: 410 },
  )
}

/** Magazin PDF / Magcloud / print production — out of scope for Zaoly web design. */
export function printOutOfScopeResponse(detail?: string) {
  return NextResponse.json(
    {
      error: PRINT_OUT_OF_SCOPE,
      detail:
        detail ??
        'Print and Magazin PDF are out of scope for Zaoly. See knowledge/print-out-of-scope-for-zaoly.md.',
      use: '/editor',
    },
    { status: 410 },
  )
}
