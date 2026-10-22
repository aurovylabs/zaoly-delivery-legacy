'use client'

import type { ElementType } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
}

export type MarkdownProseProps = {
  children: string
  className?: string
  as?: 'div' | 'blockquote' | 'article'
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function MarkdownProse({ children, className, as = 'div' }: MarkdownProseProps) {
  const text = (children ?? '').trim()
  const Root = as as ElementType

  if (!text) {
    return <Root className={cx('ds-markdown-prose', className)} />
  }

  return (
    <Root className={cx('ds-markdown-prose', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          table: ({ children: tableChildren }) => (
            <div className="ds-markdown-prose-table-wrap">
              <table>{tableChildren}</table>
            </div>
          ),
          a: ({ href, children: linkChildren }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {linkChildren}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </Root>
  )
}
