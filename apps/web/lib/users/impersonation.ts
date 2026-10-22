import 'server-only'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { envGet } from '../env-resolve'
import { paths } from '../paths'
import {
  decodeImpersonationCookie,
  encodeImpersonationCookie,
  type ImpersonationPayload,
} from './impersonation-cookie'

export type { ImpersonationPayload }
export { decodeImpersonationCookie, encodeImpersonationCookie }

export function isImpersonationEnabled(): boolean {
  const raw = envGet(paths.envZaolyPlatformAdminImpersonation)?.trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}

export async function readImpersonation(): Promise<ImpersonationPayload | null> {
  try {
    const jar = await cookies()
    return decodeImpersonationCookie(jar.get(paths.impersonationCookieName)?.value)
  } catch {
    return null
  }
}

export async function writeImpersonationCookie(payload: ImpersonationPayload): Promise<void> {
  const jar = await cookies()
  jar.set({
    name: paths.impersonationCookieName,
    value: encodeImpersonationCookie(payload),
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: paths.impersonationTtlSeconds,
  })
}

export async function clearImpersonationCookie(): Promise<void> {
  const jar = await cookies()
  jar.set({
    name: paths.impersonationCookieName,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  })
}

/** Block elevated admin mutations while view-as is active. */
export async function forbidIfImpersonating(): Promise<NextResponse | null> {
  const imp = await readImpersonation()
  if (!imp) return null
  return NextResponse.json({ error: 'impersonating' }, { status: 403 })
}
