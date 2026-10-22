/**
 * Sucrase transpile for Kit Playground sandbox validation.
 * Spec: `specs/domain/site-kit-playground.md`
 */
import { transform } from 'sucrase'

export type PlaygroundTranspileResult =
  | { ok: true; code: string }
  | { ok: false; error: string }

/** Transpile TSX → JS for syntax validation (preview uses composition tree). */
export function transpilePlaygroundTsx(source: string): PlaygroundTranspileResult {
  try {
    const { code } = transform(source, {
      transforms: ['typescript', 'jsx', 'imports'],
      jsxRuntime: 'classic',
      production: true,
    })
    return { ok: true, code }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}

/** Build sandboxed iframe HTML that shows transpile status (no parent eval). */
export function playgroundSandboxSrcdoc(options: {
  ok: boolean
  message: string
  codePreview?: string
}): string {
  const status = options.ok ? 'ok' : 'error'
  const title = options.ok ? 'Sandbox transpile OK' : 'Sandbox transpile error'
  const escaped = options.message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const code = (options.codePreview ?? '')
    .slice(0, 400)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<!DOCTYPE html><html data-sandbox="${status}"><head><meta charset="utf-8"/><style>
body{margin:0;font:12px/1.4 ui-monospace,Menlo,monospace;padding:12px;background:#0f1115;color:#e8eaed}
.ok{color:#6ee7a8}.err{color:#fca5a5} pre{white-space:pre-wrap;opacity:.7;margin-top:8px}
</style></head><body>
<div class="${options.ok ? 'ok' : 'err'}">${title}</div>
<div>${escaped}</div>
${code ? `<pre>${code}</pre>` : ''}
</body></html>`
}
