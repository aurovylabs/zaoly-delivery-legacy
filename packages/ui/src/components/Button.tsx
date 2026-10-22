import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'subtle' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'
/** `square` = magazine default; `pill` = chat send; `rounded` = soft ops chrome. */
export type ButtonShape = 'square' | 'pill' | 'rounded' | 'default'

export type ButtonClassNameOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  block?: boolean
  className?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Shared class builder for `<Button>` and link-styled anchors (`NextLink` / `<a>`). */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  shape = 'square',
  block = false,
  className,
}: ButtonClassNameOptions = {}): string {
  const resolvedShape = shape === 'default' ? 'square' : shape
  return cx(
    'ds-btn',
    `ds-btn--${variant}`,
    `ds-btn--${size}`,
    resolvedShape === 'square' && 'ds-btn--square',
    resolvedShape === 'pill' && 'ds-btn--pill',
    resolvedShape === 'rounded' && 'ds-btn--rounded',
    block && 'ds-btn--block',
    className,
  )
}

type ButtonChrome = {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  /** Optional leading icon */
  icon?: ReactNode
  /** Full-width in flex/grid parents */
  block?: boolean
  children?: ReactNode
  className?: string
}

type ButtonAsButtonProps = ButtonChrome &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    href?: undefined
  }

type ButtonAsLinkProps = ButtonChrome &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
    /** Renders an `<a>` with button classes (plain / external links). */
    href: string
    disabled?: boolean
  }

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps

/**
 * Magazine button — square + md by default.
 * Spec: specs/domain/zaoly-ui-button.md
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    shape = 'square',
    icon,
    block = false,
    children,
    className,
    ...rest
  } = props
  const classes = buttonClassName({ variant, size, shape, block, className })
  const content = (
    <>
      {icon ? <span className="ds-btn__icon">{icon}</span> : null}
      {children != null ? <span className="ds-btn__label">{children}</span> : null}
    </>
  )

  if ('href' in rest && rest.href != null) {
    const { href, target, rel, download, disabled, ...anchorRest } = rest
    return (
      <a
        href={href}
        className={classes}
        target={target}
        rel={rel}
        download={download}
        aria-disabled={disabled || undefined}
        {...anchorRest}
        {...(disabled
          ? {
              tabIndex: -1,
              onClick: (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault(),
            }
          : {})}
      >
        {content}
      </a>
    )
  }

  const { type = 'button', disabled, ...buttonRest } = rest
  return (
    <button type={type} disabled={disabled} className={classes} {...buttonRest}>
      {content}
    </button>
  )
}
