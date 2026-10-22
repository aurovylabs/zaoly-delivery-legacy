# Auth hardening W2 — launch codes + bypass lock

**Status:** Accepted · **W2** 2026-09-12  
**Backlog:** `knowledge/enterprise-hardening-backlog.md` · **Related:** `specs/domain/auth-bridge.md` · `knowledge/zaoly-redis.md`

## Goals

1. Editor launch-code redeem store MUST survive process restart and work across replicas when Redis is configured.
2. `ZAOLY_AUTH_BYPASS` MUST NOT open the app in `NODE_ENV=production` even if the env var is set.

## Launch-code store

- Mint/redeem remain HMAC-signed opaque codes (`auth-bridge.md`).
- When `ZAOLY_REDIS_URL` is set:
  - Mint MUST `SET` claims JSON at `paths.launchCodeRedisKeyPrefix:{jti}` with `EX` = remaining TTL.
  - Redeem MUST atomically consume via Redis `GETDEL` (single-use across replicas).
  - If Redis is configured but unavailable, mint MUST fail (`launch_store_unavailable`); redeem MUST fail closed (treat as unavailable/consumed) — do **not** silently fall back to process memory.
- When `ZAOLY_REDIS_URL` is unset (local/Vitest): in-process Map remains valid (same as Wave D presence fallback).

## Auth bypass

- `isAuthBypassEnabled()` MUST return `false` whenever `NODE_ENV === 'production'`.
- Outside production, truthy `ZAOLY_AUTH_BYPASS` (`1`/`true`/`yes`/`on`) still enables local open when Plexon auth env is unset.
- Staging/prod Coolify MUST leave `ZAOLY_AUTH_BYPASS` unset; the production lock is defense-in-depth.

## Non-goals

- Moving version-history FS store (W3).
- Observability vendor (W4).
- Changing launch-code TTL, signing algorithm, or redeem HTTP contract.
