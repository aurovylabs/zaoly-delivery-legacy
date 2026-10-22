import type { InputHTMLAttributes } from 'react'
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={['site-field', className].filter(Boolean).join(' ')} {...rest} />
}
