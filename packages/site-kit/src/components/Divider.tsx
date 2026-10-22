import type { HTMLAttributes } from 'react'

export function Divider({ className, style, ...rest }: HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={['site-divider', className].filter(Boolean).join(' ')}
      style={style}
      {...rest}
    />
  )
}
