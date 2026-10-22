import { printOutOfScopeResponse } from '../../../../../lib/out-of-scope-response'

/**
 * Magcloud publish — retired on Zaoly (enterprise web design).
 * Spec: specs/domain/zaoly-webdesign-cleanup.md W2 · knowledge/print-out-of-scope-for-zaoly.md
 */
export async function POST() {
  return printOutOfScopeResponse()
}
