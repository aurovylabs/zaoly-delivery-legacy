/**
 * Chart studio open/dismiss rules.
 * Spec: `specs/domain/chart-studio-panel.md`
 */
export function isChartStudioSubjectType(type: string | null | undefined): boolean {
  return type === 'SiteChart'
}

/**
 * WHEN selection id changes while still a chart subject, clear user dismiss so the panel re-opens.
 * WHEN selection leaves chart types, panel is closed (caller sets open=false).
 */
export function shouldClearChartStudioDismiss(
  prevSelectedId: string | null,
  nextSelectedId: string | null,
  nextIsChart: boolean,
): boolean {
  if (!nextIsChart) return false
  return prevSelectedId !== nextSelectedId
}

export function isChartStudioOpen(args: {
  subjectIsChart: boolean
  userDismissed: boolean
}): boolean {
  return args.subjectIsChart && !args.userDismissed
}
