import type { SceneNode } from '@zaoly/contracts'

function resolveTailwindClasses(node: SceneNode): string[] {
  const classes: string[] = []
  const tag = node.type.startsWith('Site') ? node.type.replace('Site', '') : node.type

  if (tag === 'Stack' || tag === 'Card' || tag === 'Container') {
    classes.push('flex')
    if (node.props?.direction === 'row') {
      classes.push('flex-row')
    } else {
      classes.push('flex-col')
    }
    const gap = String(node.props?.gap || '')
    if (gap.includes('8')) classes.push('gap-2')
    else if (gap.includes('12')) classes.push('gap-3')
    else if (gap.includes('16') || gap.includes('4')) classes.push('gap-4')
    else if (gap.includes('24') || gap.includes('6')) classes.push('gap-6')
    else if (gap.includes('32') || gap.includes('8')) classes.push('gap-8')
    else classes.push('gap-4')
  } else if (tag === 'Grid') {
    classes.push('grid')
    const cols = Number(node.props?.columns || 3)
    classes.push(`grid-cols-${cols}`)
    classes.push('gap-4')
  }

  // Padding
  if (node.style?.padding || node.props?.padding) {
    const pad = String(node.style?.padding || node.props?.padding)
    if (pad.includes('24') || pad.includes('6')) classes.push('p-6')
    else if (pad.includes('16') || pad.includes('4')) classes.push('p-4')
    else if (pad.includes('32') || pad.includes('8')) classes.push('p-8')
    else classes.push('p-4')
  }

  // Border radius
  if (node.style?.borderRadius || node.props?.radius) {
    classes.push('rounded-lg')
  }

  // Typography
  if (tag === 'Heading') {
    classes.push('text-3xl font-bold tracking-tight text-white')
  } else if (tag === 'Lede') {
    classes.push('text-xl font-medium text-zinc-300')
  } else if (tag === 'Text') {
    classes.push('text-base text-zinc-400 leading-relaxed')
  } else if (tag === 'Button') {
    classes.push(
      'inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-md transition-colors',
    )
  } else if (tag === 'Image') {
    classes.push('w-full h-auto object-cover rounded-lg')
  }

  // Background
  if (node.style?.backgroundColor || node.style?.background || node.props?.background) {
    classes.push('bg-zinc-900 border border-zinc-800')
  }
  if (node.props?.backgroundImage) {
    const bgImg = String(node.props.backgroundImage).trim()
    const rawUrl = bgImg.startsWith('url(') ? bgImg.slice(4, -1).replace(/["']/g, '') : bgImg
    classes.push(`bg-[url('${rawUrl}')]`)
    const bgSize = (node.props.backgroundSize as string) || 'cover'
    if (bgSize === 'cover') classes.push('bg-cover')
    else if (bgSize === 'contain') classes.push('bg-contain')
    else if (bgSize === 'auto') classes.push('bg-auto')

    const bgPos = (node.props.backgroundPosition as string) || 'center'
    if (bgPos === 'center') classes.push('bg-center')
    else if (bgPos === 'top') classes.push('bg-top')
    else if (bgPos === 'bottom') classes.push('bg-bottom')
    else if (bgPos === 'left') classes.push('bg-left')
    else if (bgPos === 'right') classes.push('bg-right')

    const bgRep = (node.props.backgroundRepeat as string) || 'no-repeat'
    if (bgRep === 'no-repeat') classes.push('bg-no-repeat')
    else if (bgRep === 'repeat') classes.push('bg-repeat')
  }

  return classes
}

export function generateTailwindHtml(node: SceneNode, indentLevel = 2): string {
  const indent = ' '.repeat(indentLevel)
  const tag = node.type.startsWith('Site') ? node.type.replace('Site', '') : node.type
  const htmlTag =
    tag === 'Button'
      ? 'button'
      : tag === 'Image'
        ? 'img'
        : tag === 'Heading'
          ? 'h2'
          : tag === 'Text'
            ? 'p'
            : 'div'
  const classes = resolveTailwindClasses(node).join(' ')
  const classAttr = classes ? ` class="${classes}"` : ''

  const textContent =
    (node.props?.children as string) ||
    (node.props?.text as string) ||
    (node.props?.label as string) ||
    ''
  const hasChildren = Boolean(node.children && node.children.length > 0)

  if (htmlTag === 'img') {
    const src = (node.props?.src as string) || ''
    const alt = (node.props?.alt as string) || ''
    return `${indent}<img src="${src}" alt="${alt}"${classAttr} />`
  }

  if (!hasChildren && !textContent) {
    return `${indent}<${htmlTag}${classAttr}></${htmlTag}>`
  }

  if (!hasChildren && textContent) {
    return `${indent}<${htmlTag}${classAttr}>${textContent}</${htmlTag}>`
  }

  const childrenHtml = (node.children || [])
    .map((c) => generateTailwindHtml(c, indentLevel + 2))
    .join('\n')

  return `${indent}<${htmlTag}${classAttr}>\n${childrenHtml}\n${indent}</${htmlTag}>`
}
