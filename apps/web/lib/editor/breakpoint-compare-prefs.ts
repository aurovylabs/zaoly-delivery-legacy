/**
 * Wave G — persist Compare board preference (device-local, not scene).
 * Spec: specs/domain/responsive-breakpoint-closeout.md
 */
import { paths } from '../paths'

export function loadBreakpointCompareMode(): boolean {
  try {
    return localStorage.getItem(paths.breakpointCompareStorageKey) === '1'
  } catch {
    return false
  }
}

export function saveBreakpointCompareMode(enabled: boolean): void {
  try {
    localStorage.setItem(paths.breakpointCompareStorageKey, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
}
