import type { TextareaHTMLAttributes } from 'react'
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={['site-textarea', className].filter(Boolean).join(' ')} {...rest} />
}
