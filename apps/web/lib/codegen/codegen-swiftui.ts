import type { SceneNode } from '@zaoly/contracts'

function cleanName(name?: string, fallback = 'Component'): string {
  if (!name) return fallback
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '')
  if (!cleaned) return fallback
  return cleaned[0].toUpperCase() + cleaned.slice(1)
}

export function generateSwiftUiView(node: SceneNode, indentLevel = 4): string {
  const indent = ' '.repeat(indentLevel)
  const tag = node.type.startsWith('Site') ? node.type.replace('Site', '') : node.type
  const textContent = (node.props?.children as string) || (node.props?.text as string) || ''
  const hasChildren = Boolean(node.children && node.children.length > 0)

  let base = ''

  if (tag === 'Text' || tag === 'Heading' || tag === 'Lede') {
    const isHeading = tag === 'Heading'
    base = `${indent}Text("${textContent.replace(/"/g, '\\"')}")\n${indent}    .font(.system(size: ${isHeading ? 28 : 16}${isHeading ? ', weight: .bold' : ''}))\n${indent}    .foregroundColor(.primary)`
  } else if (tag === 'Button') {
    const label = (node.props?.label as string) || textContent || 'Button'
    base = `${indent}Button(action: {}) {\n${indent}    Text("${label.replace(/"/g, '\\"')}")\n${indent}        .fontWeight(.semibold)\n${indent}        .foregroundColor(.white)\n${indent}        .padding(.horizontal, 16)\n${indent}        .padding(.vertical, 8)\n${indent}        .background(Color.orange)\n${indent}        .cornerRadius(6)\n${indent}}\n${indent}.buttonStyle(.plain)`
  } else if (tag === 'Image') {
    const src = (node.props?.src as string) || ''
    base = `${indent}AsyncImage(url: URL(string: "${src}")) {\n${indent}    $0.resizable().aspectRatio(contentMode: .fill)\n${indent}} placeholder: {\n${indent}    Color.gray.opacity(0.2)\n${indent}}\n${indent}.frame(height: 200)\n${indent}.clipped()`
  } else if (tag === 'Grid') {
    const cols = Number(node.props?.columns || 3)
    const childJsx = (node.children || []).map((c) => generateSwiftUiView(c, indentLevel + 4)).join('\n')
    base = `${indent}LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 16), count: ${cols}), spacing: 16) {\n${childJsx}\n${indent}}`
  } else {
    // Stack / Card / Container / Frame
    const isRow = node.props?.direction === 'row'
    const stackName = isRow ? 'HStack' : 'VStack'
    const alignment = isRow ? '' : 'alignment: .leading, '
    const childJsx = hasChildren
      ? (node.children || []).map((c) => generateSwiftUiView(c, indentLevel + 4)).join('\n')
      : ''
    base = `${indent}${stackName}(${alignment}spacing: 16) {\n${childJsx}\n${indent}}`
  }

  // Apply padding / background if present
  if (node.style?.padding || node.props?.padding) {
    base += `\n${indent}.padding()`
  }
  if (node.style?.backgroundColor || node.style?.background) {
    base += `\n${indent}.background(Color(hex: "${String(node.style?.backgroundColor || node.style?.background)}"))`
  }
  if (node.props?.backgroundImage) {
    const bgImg = String(node.props.backgroundImage).trim()
    const rawUrl = bgImg.startsWith('url(') ? bgImg.slice(4, -1).replace(/["']/g, '') : bgImg
    base += `\n${indent}.background(\n${indent}    AsyncImage(url: URL(string: "${rawUrl}")) {\n${indent}        $0.resizable().aspectRatio(contentMode: .fill)\n${indent}    } placeholder: { Color.clear }\n${indent})`
  }
  if (node.style?.borderRadius) {
    base += `\n${indent}.cornerRadius(8)`
  }

  return base
}

export function generateSwiftUiComponent(node: SceneNode, componentName?: string): string {
  const name = cleanName(componentName || node.name, 'Exported') + 'View'
  const body = generateSwiftUiView(node, 8)

  return `import SwiftUI

public struct ${name}: View {
    public init() {}

    public var body: some View {
${body}
    }
}
`
}
