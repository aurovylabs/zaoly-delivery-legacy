import { suiteOutOfScopeResponse } from '../../../../lib/out-of-scope-response'

/** Suite federation probe — retired on Zaoly standalone. */
export async function GET() {
  return suiteOutOfScopeResponse()
}
