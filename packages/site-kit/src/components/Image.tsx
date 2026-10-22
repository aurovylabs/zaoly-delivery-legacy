import type { ImgHTMLAttributes } from 'react'

/** Default seed src — matches `paths.imagePlaceholderUrl` in CREATION. */
export const SITE_IMAGE_PLACEHOLDER_SRC = 'https://placehold.co/320x180'

export type ImageProps = {
  src?: string
  alt?: string
  className?: string
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>

export function Image({
  src = SITE_IMAGE_PLACEHOLDER_SRC,
  alt = 'Image',
  className,
  ...rest
}: ImageProps) {
  return (
    <img
      className={['site-img', className].filter(Boolean).join(' ')}
      src={src}
      alt={alt}
      {...rest}
    />
  )
}
