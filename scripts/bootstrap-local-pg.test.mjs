#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { EXPECTED_TABLES, SCHEMA_STATEMENTS } from './bootstrap-local-pg.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('compose exposes local Postgres on 5434', () => {
  const compose = readFileSync(join(root, 'docker-compose.yml'), 'utf8')
  assert.match(compose, /image:\s*postgres:17-alpine/)
  assert.match(compose, /'5434:5432'/)
  assert.match(compose, /POSTGRES_DB:\s*zaoly/)
})

test('bootstrap SQL covers the documented tables', () => {
  const sql = SCHEMA_STATEMENTS.join('\n')
  for (const table of EXPECTED_TABLES) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`))
  }
})
