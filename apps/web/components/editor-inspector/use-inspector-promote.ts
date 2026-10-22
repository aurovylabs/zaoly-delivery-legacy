'use client'

import type { Translator } from '../../lib/i18n'
import { useState } from 'react'
import {
  applyDigitalScalar,
  isValidStudioTokenPath,
  suggestPromoteTokenPath,
} from '../../lib/inspect/digital-edit'
import type {
  BrandTokenPackResponse,
  ZaolyPackLeaf,
} from '../../lib/inspect/token-catalog'
import { isBrandPackPromoteWritable } from '../../lib/inspect/brand-pack-writable'
import type { useInspectTokenCatalog } from '../../lib/inspect/token-catalog-context'
import { paths } from '../../lib/paths'

export type InspectorPromoteDraft = {
  fieldName: string
  type: string
  literal: string
  path: string
}

export type UseInspectorPromoteParams = {
  brandPack: BrandTokenPackResponse | null
  catalog: ReturnType<typeof useInspectTokenCatalog>
  setToken: (key: string, tokenPath: string) => void
  onTokenSaved?: (token: ZaolyPackLeaf) => void
  t: Translator
}

export function useInspectorPromote({
  brandPack,
  catalog,
  setToken,
  onTokenSaved,
  t,
}: UseInspectorPromoteParams) {
  const [promoteDraft, setPromoteDraft] = useState<InspectorPromoteDraft | null>(null)
  const [promotePath, setPromotePath] = useState('')
  const [promoteBusy, setPromoteBusy] = useState(false)
  const [promoteError, setPromoteError] = useState<string | null>(null)

  function openPromoteLiteral(fieldName: string, type: string, literal: string) {
    const path = suggestPromoteTokenPath(type, literal)
    setPromoteDraft({ fieldName, type, literal: literal.trim(), path })
    setPromotePath(path)
    setPromoteError(null)
  }

  function closePromoteLiteral() {
    if (promoteBusy) return
    setPromoteDraft(null)
    setPromoteError(null)
  }

  function applyPromotedToken(token: ZaolyPackLeaf, fieldName: string) {
    onTokenSaved?.(token)
    setToken(fieldName, token.path)
    setPromoteDraft(null)
    setPromotePath('')
  }

  async function submitPromoteLiteral() {
    if (!promoteDraft || !brandPack || !isBrandPackPromoteWritable(brandPack)) return
    const pathName = promotePath.trim()
    if (!isValidStudioTokenPath(pathName, promoteDraft.type)) {
      setPromoteError(t('editor.tokenStudioAddInvalidPath'))
      return
    }
    if (
      brandPack.tokens.some((leaf) => leaf.path === pathName) ||
      catalog.some((tok) => tok.path === pathName)
    ) {
      setPromoteError(t('editor.tokenStudioAddExists'))
      return
    }
    const nextValue = applyDigitalScalar(promoteDraft.type, '{}', promoteDraft.literal)
    if (!nextValue) {
      setPromoteError(t('editor.tokenStudioInvalid'))
      return
    }

    setPromoteBusy(true)
    setPromoteError(null)
    try {
      const res = await fetch(paths.routes.apiTokens, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          path: pathName,
          type: promoteDraft.type,
          value: nextValue,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        setPromoteError(body?.error ?? t('editor.tokenStudioSaveFailed'))
        return
      }
      const body = (await res.json()) as { token?: ZaolyPackLeaf }
      const token =
        body.token ??
        ({
          path: pathName,
          type: promoteDraft.type,
          value: nextValue,
          status: 'active' as const,
        } satisfies ZaolyPackLeaf)
      applyPromotedToken(token, promoteDraft.fieldName)
    } catch {
      setPromoteError(t('editor.tokenStudioSaveFailed'))
    } finally {
      setPromoteBusy(false)
    }
  }

  return {
    openPromoteLiteral,
    promoteDialog: {
      draft: promoteDraft,
      path: promotePath,
      busy: promoteBusy,
      error: promoteError,
      localPreview: false,
      setPath: setPromotePath,
      close: closePromoteLiteral,
      submit: submitPromoteLiteral,
    },
  }
}
