import { paths } from '../lib/paths'
import { ZaolySealMark } from './zaoly-seal-mark'
import { LoginLandscape } from './login-landscape'
import type { ReactNode } from 'react'

/** Login and register use a split composition; other auth screens keep the centered stack. */
export function AuthScreenLayout({ children, landscape = false }: { children: ReactNode; landscape?: boolean }) {
  return (
    <div className={`creation-login${landscape ? ' creation-login--landscape' : ''}`}>
      {landscape ? (
        <div className="creation-login__landscape" aria-hidden="true">
          <LoginLandscape />
        </div>
      ) : null}
      <div className="creation-login__brand" data-testid="login-brand-mark">
        <ZaolySealMark size={landscape ? paths.loginSplitSealSizePx : paths.loginSealSizePx} />
        <span className="creation-login__wordmark">{paths.brandLabel}</span>
      </div>
      <div className="creation-login__panel">{children}</div>
    </div>
  )
}
