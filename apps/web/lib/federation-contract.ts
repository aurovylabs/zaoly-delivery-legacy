import { NextResponse } from 'next/server'
import { paths } from './paths'

export const FEDERATION_CONTRACT_VERSION = paths.federationContract
export const FEDERATION_CONTRACT_VERSION_HEADER = 'X-Federation-Contract-Version'
export const SERVICE_SECRET_HEADER = 'X-Service-Secret'

export function getFederationContractHeaders(secret?: string): HeadersInit {
  return {
    [FEDERATION_CONTRACT_VERSION_HEADER]: FEDERATION_CONTRACT_VERSION,
    ...(secret ? { [SERVICE_SECRET_HEADER]: secret } : {}),
  }
}

export function isProvisioningAuthorized(request: Request, expectedSecret: string): boolean {
  const requestSecret = request.headers.get(SERVICE_SECRET_HEADER)?.trim()
  const contractVersion = request.headers.get(FEDERATION_CONTRACT_VERSION_HEADER)?.trim()
  return Boolean(
    expectedSecret &&
      requestSecret &&
      requestSecret === expectedSecret &&
      contractVersion === FEDERATION_CONTRACT_VERSION,
  )
}

export function jsonWithContract(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  headers.set(FEDERATION_CONTRACT_VERSION_HEADER, FEDERATION_CONTRACT_VERSION)
  return NextResponse.json(body, { ...init, headers })
}
