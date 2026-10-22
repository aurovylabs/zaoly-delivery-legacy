import type { ImgHTMLAttributes } from 'react'

export type ImageProps = {
  className?: string
  alt: string
  src: string
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'className' | 'alt' | 'src'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Composition image — requires alt. */
export function Image({ className, alt, src, ...rest }: ImageProps) {
  return <img className={cx('ds-image', className)} alt={alt} src={src} {...rest} />
}
