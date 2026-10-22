import type { HTMLAttributes, ReactNode } from 'react'
import { SectionChrome } from '../SectionChrome'
import { Text } from './Text'

export type SettingsBandProps = {
  title: string
  help?: ReactNode
  children?: ReactNode
  className?: string
  'data-testid'?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'title' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Quiet magazine settings band — specs/domain/zaoly-ui-settings-shell.md */
export function SettingsBand({
  title,
  help,
  children,
  className,
  'data-testid': testId,
  ...rest
}: SettingsBandProps) {
  return (
    <section className={cx('ds-settings-band', className)} data-testid={testId} {...rest}>
      <div className="ds-settings-band__chrome">
        <SectionChrome quiet title={title} as="h2" />
        {help != null ? (
          <Text role="meta" className="ds-settings-band__help">
            {help}
          </Text>
        ) : null}
      </div>
      <div className="ds-settings-band__body">{children}</div>
    </section>
  )
}

export type SettingsShellLabels = {
  account: string
  profile: string
  appearance: string
  language: string
}

export type SettingsShellProps = {
  lede?: ReactNode
  account?: ReactNode
  profile?: ReactNode
  appearance?: ReactNode
  language?: ReactNode
  extras?: ReactNode
  labels: SettingsShellLabels
  accountHelp?: ReactNode
  profileHelp?: ReactNode
  appearanceHelp?: ReactNode
  languageHelp?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

/**
 * Shared magazine settings layout — Account → Profile → Appearance → Language → extras.
 * Spec: specs/domain/zaoly-ui-settings-shell.md
 */
export function SettingsShell({
  lede,
  account,
  profile,
  appearance,
  language,
  extras,
  labels,
  accountHelp,
  profileHelp,
  appearanceHelp,
  languageHelp,
  className,
  ...rest
}: SettingsShellProps) {
  return (
    <div className={cx('ds-settings-shell', className)} data-testid="settings-shell" {...rest}>
      {lede != null ? <div className="ds-settings-shell__lede">{lede}</div> : null}
      {account != null ? (
        <SettingsBand title={labels.account} help={accountHelp} data-testid="settings-band-account">
          {account}
        </SettingsBand>
      ) : null}
      {profile != null ? (
        <SettingsBand title={labels.profile} help={profileHelp} data-testid="settings-band-profile">
          {profile}
        </SettingsBand>
      ) : null}
      {appearance != null ? (
        <SettingsBand
          title={labels.appearance}
          help={appearanceHelp}
          data-testid="settings-band-appearance"
        >
          {appearance}
        </SettingsBand>
      ) : null}
      {language != null ? (
        <SettingsBand
          title={labels.language}
          help={languageHelp}
          data-testid="settings-band-language"
        >
          {language}
        </SettingsBand>
      ) : null}
      {extras != null ? <div className="ds-settings-shell__extras">{extras}</div> : null}
    </div>
  )
}
