import { paths } from './paths'

export function getAuthSecret(): string {
  const fromEnv = process.env[paths.envAuthSecret]?.trim()
  if (fromEnv && fromEnv.length >= 32) return fromEnv
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[zaoly] AUTH_SECRET is required in production (min 32 chars). Refusing repo fallback.',
    )
  }
  return paths.authDevFallbackSecret
}
