import { upstreamPackOutOfScopeResponse } from '../../../lib/out-of-scope-response'


/**
 * Upstream brand-pack BFF — retired on Zaoly.
 * Spec: `knowledge/upstream-pack-out-of-scope-for-zaoly.md` · use `paths.routes.apiTokens`.
 */
export async function GET() {
  return upstreamPackOutOfScopeResponse()
}

export async function PATCH() {
  return upstreamPackOutOfScopeResponse()
}
