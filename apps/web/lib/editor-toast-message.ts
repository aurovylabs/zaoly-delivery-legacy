import { paths } from './paths'

/**
 * Keep editor snackbars short — never surface full Storyblok/scene JSON dumps.
 */
export function editorToastMessage(raw: string, fallback = 'Something went wrong'): string {
  const text = raw.trim() || fallback
  if (
    text.includes('zaoly-storyblok-poc') ||
    text.includes('zaoly-storyblok-poc') ||
    text.includes('"components"')
  ) {
    return 'Storyblok handoff is not available on this host.'
  }
  if (text === 'forbidden' || text.includes('"error":"forbidden"')) {
    return 'You do not have edit access to this scene.'
  }
  const max = paths.editorToastMessageMaxChars
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}
