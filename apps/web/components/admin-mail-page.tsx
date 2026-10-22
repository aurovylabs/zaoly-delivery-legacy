'use client'

import { SettingsSmtpBand } from './settings-smtp-band'

export function AdminMailPage() {
  return (
    <div className="zaoly-admin-hub" data-testid="zaoly-admin-mail">
      <SettingsSmtpBand />
    </div>
  )
}
