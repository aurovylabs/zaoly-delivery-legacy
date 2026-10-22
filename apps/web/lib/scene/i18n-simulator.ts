import type { SceneNode, I18nStressTestConfig } from '@zaoly/contracts'

const VOWEL_MAP: Record<string, string> = {
  a: 'å',
  A: 'Å',
  e: 'é',
  E: 'É',
  i: 'ï',
  I: 'Ï',
  o: 'ö',
  O: 'Ö',
  u: 'û',
  U: 'Û',
}

/**
 * Transforms a plain text string into a pseudo-localized string with +35% character expansion
 * and accented character substitutions to simulate German/Greek/multilingual text expansion.
 */
export function pseudoLocalizeText(text: string, multiplier = 1.35, bracketEnclosure = true): string {
  if (!text || typeof text !== 'string') return text

  // 1. Substitute vowels with accented counterparts
  let accented = ''
  for (const ch of text) {
    accented += VOWEL_MAP[ch] ?? ch
  }

  // 2. Expand string length by repeating vowels to reach desired multiplier
  const targetLen = Math.max(text.length, Math.round(text.length * multiplier))
  let expanded = ''
  for (const ch of accented) {
    expanded += ch
    if (expanded.length < targetLen && /[åéïöûÅÉÏÖÛaeiouAEIOU]/.test(ch)) {
      expanded += ch.toLowerCase()
    }
  }

  // If still below target length, append expansion markers
  while (expanded.length < targetLen) {
    expanded += '!'
  }

  if (bracketEnclosure) {
    return `[${expanded} !!!]`
  }
  return expanded
}

/**
 * Recursively applies i18n pseudo-localization or RTL direction to an AST tree
 * without modifying the original persistent node.
 */
export function simulateNodeTreeI18n(
  node: SceneNode,
  config: I18nStressTestConfig,
): SceneNode {
  const cloned: SceneNode = {
    ...node,
    props: node.props ? { ...node.props } : {},
    style: node.style ? { ...node.style } : {},
  }

  if (config.pseudoLocalization) {
    const mult = config.expansionMultiplier ?? 1.35
    const brackets = config.bracketEnclosure ?? true

    if (typeof cloned.props?.text === 'string') {
      cloned.props.text = pseudoLocalizeText(cloned.props.text, mult, brackets)
    }
    if (typeof cloned.props?.label === 'string') {
      cloned.props.label = pseudoLocalizeText(cloned.props.label, mult, brackets)
    }
    if (typeof cloned.props?.title === 'string') {
      cloned.props.title = pseudoLocalizeText(cloned.props.title, mult, brackets)
    }
    if (typeof cloned.props?.placeholder === 'string') {
      cloned.props.placeholder = pseudoLocalizeText(cloned.props.placeholder, mult, brackets)
    }
    if (typeof cloned.props?.children === 'string') {
      cloned.props.children = pseudoLocalizeText(cloned.props.children, mult, brackets)
    }
  }

  if (config.direction === 'rtl') {
    if (cloned.style) {
      cloned.style.direction = 'rtl'
    }
    if (cloned.props) {
      cloned.props.dir = 'rtl'
      if (cloned.props.direction === 'row') {
        cloned.props.direction = 'row-reverse'
      }
    }
  }

  if (node.children && node.children.length > 0) {
    cloned.children = node.children.map((child) =>
      simulateNodeTreeI18n(child, config),
    )
  }

  return cloned
}
