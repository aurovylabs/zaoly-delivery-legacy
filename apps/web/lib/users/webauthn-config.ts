import { zaolyPublicUrl } from '../runtime-config'
import { paths } from '../paths'

export function webauthnRelyingParty(): {
  rpID: string
  rpName: string
  origin: string
} {
  const origin = zaolyPublicUrl().replace(/\/$/, '')
  let rpID = 'localhost'
  try {
    rpID = new URL(origin).hostname
  } catch {
    /* keep localhost */
  }
  return { rpID, rpName: paths.mfaIssuer, origin }
}
