# Version store durable + backup — W3

**Status:** Accepted · **W3** 2026-09-12  
**Backlog:** `knowledge/enterprise-hardening-backlog.md`  
**Related:** `specs/domain/editor-version-history.md` · `knowledge/backup-rollback.md` · `knowledge/creation-postgres.md`

## Goals

1. Scene version checkpoints MUST survive container recycle when Postgres is configured (same gate as live scenes: `ZAOLY_DATABASE_URL`).
2. Operators MUST have a written backup/restore/rollback path for the single-host Coolify topology.

## Version store backends

| Backend | When | Location |
|---------|------|----------|
| `postgres` | `ZAOLY_DATABASE_URL` set | Table `scene_versions` (created on first use) |
| `fs` | DB unset (local / Vitest) | `ZAOLY_VERSION_STORE_PATH` or `paths.sceneVersionsStoreRelPath` (`.data/scene-versions`) |

- WHEN Postgres is configured, mint/list/get/restore MUST use `scene_versions` — do **not** write only to ephemeral container FS.
- WHEN Postgres is unset, the FS + in-process cache remain valid for local/tests.
- `GET /api/health` MUST report `versionStore: "postgres" | "fs"` without secrets.

## Schema (`scene_versions`)

| Column | Type |
|--------|------|
| `id` | TEXT PK |
| `scene_id` | TEXT NOT NULL |
| `version_number` | INTEGER NOT NULL |
| `name` | TEXT NOT NULL |
| `description` | TEXT |
| `is_auto_save` | BOOLEAN NOT NULL |
| `author_json` | JSONB NOT NULL |
| `page_count` | INTEGER NOT NULL |
| `node_count` | INTEGER NOT NULL |
| `snapshot` | JSONB NOT NULL (`CompositionScene`) |
| `created_at` | TIMESTAMPTZ NOT NULL |

Unique `(scene_id, version_number)`. Index `(scene_id, version_number DESC)`.

## Backup / scale notes

- Single Coolify app + one Postgres + one Redis on StandaloneDocker — replicas blocked (`knowledge/zaoly-redis.md`). Documented in `knowledge/backup-rollback.md`.
- Postgres Coolify Backups tab (S3 optional) covers `scenes` **and** `scene_versions`.
- Redis (presence / launch codes) is ephemeral by design — not a restore target.

## Non-goals

- Coolify Swarm multi-replica enablement.
- Migrating historical FS checkpoints into Postgres automatically.
- Observability vendor (W4).
