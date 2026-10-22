/**
 * Zaoly MCP tools — scene/layout v2 (HTTP proxy only).
 * Spec: specs/domain/mcp-server.md § Tool surface v2
 */
import { z } from 'zod'
import { type ZaolyRequestInit, zaolyFetch, isZaolyError } from './zaoly-client.js'

function toTextContent(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  // Compact JSON — pretty-print bloats scene_tree_index and slows the agent LLM round.
  return JSON.stringify(value)
}

export function compactCraftDebugPayload(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const rec = value as Record<string, unknown>
  const bundle =
    rec.bundle && typeof rec.bundle === 'object' && !Array.isArray(rec.bundle)
      ? (rec.bundle as Record<string, unknown>)
      : rec
  const design =
    bundle.designSystem && typeof bundle.designSystem === 'object' && !Array.isArray(bundle.designSystem)
      ? (bundle.designSystem as Record<string, unknown>)
      : {}
  const sliceList = (raw: unknown, n: number) =>
    Array.isArray(raw) ? raw.slice(0, n) : []
  return {
    sceneId: rec.sceneId,
    pageId: rec.pageId ?? bundle.pageId,
    updatedAt: rec.updatedAt,
    craftDebugAt: rec.craftDebugAt ?? null,
    craftFlags: bundle.craftFlags ?? [],
    sceneStats: bundle.sceneStats ?? null,
    designSystem: {
      colors: sliceList(design.colors, 12),
      fonts: sliceList(design.fonts, 6),
      gaps: sliceList(design.gaps ?? design.spacing, 8),
    },
    spirion: bundle.spirion ?? null,
    importWarnings: sliceList(bundle.importWarnings, 12),
    importHtmlBytes: bundle.importHtmlBytes,
  }
}

export function compactPageSavePayload(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const rec = value as Record<string, unknown>
  const scene =
    rec.scene && typeof rec.scene === 'object' && !Array.isArray(rec.scene)
      ? (rec.scene as { id?: string; updatedAt?: string })
      : {}
  return {
    ok: rec.ok,
    error: rec.error,
    code: rec.code,
    sceneId: rec.sceneId ?? scene.id,
    updatedAt: rec.updatedAt ?? scene.updatedAt,
    exportName: rec.exportName,
    masterId: rec.masterId,
    componentId: rec.componentId,
    storyTitle: rec.storyTitle,
    results: rec.results,
  }
}

type ToolServer = {
  registerTool: (
    name: string,
    config: { title?: string; description?: string; inputSchema?: z.ZodTypeAny },
    cb: (args: unknown) => Promise<{ content: Array<{ type: 'text'; text: string }> }>,
  ) => void
}

const actorFields = {
  actorUserId: z
    .string()
    .min(1)
    .describe('Actor user id for X-Actor-User-Id (required for service writes/reads).'),
  actorLabel: z
    .string()
    .optional()
    .describe('Optional audit label forwarded as X-Actor-Label.'),
}

async function textResult(path: string, options?: ZaolyRequestInit) {
  const res = await zaolyFetch(path, options)
  return { content: [{ type: 'text' as const, text: toTextContent(res) }] }
}

function missingActorResult() {
  return {
    content: [
      {
        type: 'text' as const,
        text: toTextContent({
          error: true,
          message: 'actorUserId required for service scene tools',
        }),
      },
    ],
  }
}

/** Curated agent surface — page ops from scene-pages.md; node ops for layout. */
export const SCENE_OP_NAMES = [
  'set_prop',
  'set_token_binding',
  'clear_token_binding',
  'set_style',
  'set_breakpoint_override',
  'clear_breakpoint_override',
  'set_flags',
  'insert_child',
  'insert_instance',
  'remove_node',
  'reorder_node',
  'move_node',
  'wrap_nodes',
  'unwrap_node',
  'ensure_palette_master',
  'create_master',
  'bind_master_composition',
  'add_page',
  'rename_page',
  'duplicate_page',
  'set_active_page',
  'delete_page',
  'reorder_pages',
  'move_node_to_page',
] as const

const sceneOpSchema = z
  .object({
    op: z
      .enum(SCENE_OP_NAMES)
      .describe(
        'Allowed: add_page {name?}, set_active_page {pageId}, rename_page, duplicate_page, delete_page, move_node_to_page; insert_child (parentId + child{id,type,name?,props?}), insert_instance (masterId+parentId+optional props for overrides), set_prop {nodeId, key, value} — key is required (not prop/property), set_token_binding, remove_node, reorder_node, bind_master_composition {masterId,exportName}. Page copy: prefer insert_child with real props — never leave seed text (Get started, Option A, Text). If insert_instance, pass props or set_prop same batch. New page → add_page first. NEVER insert_node, add_instance, append_child.',
      ),
  })
  .passthrough()

/** LLMs often stringify large `ops` arrays; accept JSON string and coerce to array. */
function coerceOpsArray(value: unknown): unknown {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  try {
    const parsed = JSON.parse(trimmed) as unknown
    return Array.isArray(parsed) ? parsed : value
  } catch {
    return value
  }
}

const sceneOpsField = z.preprocess(
  coerceOpsArray,
  z.array(sceneOpSchema).min(1).max(64),
)

export const ZAOLY_V2_TOOL_NAMES = [
  'zaoly.scene_get',
  'zaoly.scene_list',
  'zaoly.scene_tree_index',
  'zaoly.scene_content_audit',
  'zaoly.scene_preview',
  'zaoly.scene_craft_debug',
  'zaoly.scene_import_html',
  'zaoly.scene_apply_ops',
  'zaoly.editor_palette',
  'zaoly.brand_tokens_get',
  'zaoly.site_kit_composition_save',
  'zaoly.site_kit_page_save',
] as const

export function registerZaolyV2Tools(server: ToolServer) {
  server.registerTool(
    'zaoly.scene_get',
    {
      title: 'Get scene',
      description:
        'GET /api/scenes/:id — full CompositionScene. Prefer zaoly.scene_tree_index for large scenes.',
      inputSchema: z.object({
        sceneId: z.string().min(1),
        ...actorFields,
      }),
    },
    async (args) => {
      const { sceneId, actorUserId, actorLabel } = args as {
        sceneId: string
        actorUserId?: string
        actorLabel?: string
      }
      if (!actorUserId?.trim()) return missingActorResult()
      return textResult(`/api/scenes/${encodeURIComponent(sceneId.trim())}`, {
        zaoly: { actorUserId, actorLabel },
      })
    },
  )

  server.registerTool(
    'zaoly.scene_list',
    {
      title: 'List scenes',
      description: 'GET /api/scenes?platformProjectId= — scenes for a Collection.',
      inputSchema: z.object({
        platformProjectId: z.string().optional().describe('Filter by Plexon Collection id'),
        ...actorFields,
      }),
    },
    async (args) => {
      const { platformProjectId, actorUserId, actorLabel } = args as {
        platformProjectId?: string
        actorUserId?: string
        actorLabel?: string
      }
      if (!actorUserId?.trim()) return missingActorResult()
      const params = new URLSearchParams()
      if (platformProjectId?.trim()) {
        params.set('platformProjectId', platformProjectId.trim())
      }
      const qs = params.toString()
      return textResult(`/api/scenes${qs ? `?${qs}` : ''}`, {
        zaoly: { actorUserId, actorLabel },
      })
    },
  )

  server.registerTool(
    'zaoly.scene_tree_index',
    {
      title: 'Scene tree index',
      description:
        'GET /api/scenes/:id/tree — compact structural index (no props/tokenBindings). Use before planning ops.',
      inputSchema: z.object({
        sceneId: z.string().min(1),
        ...actorFields,
      }),
    },
    async (args) => {
      const { sceneId, actorUserId, actorLabel } = args as {
        sceneId: string
        actorUserId?: string
        actorLabel?: string
      }
      if (!actorUserId?.trim()) return missingActorResult()
      return textResult(`/api/scenes/${encodeURIComponent(sceneId.trim())}/tree`, {
        zaoly: { actorUserId, actorLabel },
      })
    },
  )

  server.registerTool(
    'zaoly.scene_content_audit',
    {
      title: 'Scene content audit',
      description:
        'GET /api/scenes/:id/content-audit — expand Instances, scan seed copy / missing PDP signals (no pixels). Call before finishing PDP/landing builds; fix error findings via set_prop / insert_child.',
      inputSchema: z.object({
        sceneId: z.string().min(1),
        ...actorFields,
      }),
    },
    async (args) => {
      const { sceneId, actorUserId, actorLabel } = args as {
        sceneId: string
        actorUserId?: string
        actorLabel?: string
      }
      if (!actorUserId?.trim()) return missingActorResult()
      return textResult(`/api/scenes/${encodeURIComponent(sceneId.trim())}/content-audit`, {
        zaoly: { actorUserId, actorLabel },
      })
    },
  )

  server.registerTool(
    'zaoly.scene_preview',
    {
      title: 'Scene preview WebP',
      description:
        'GET /api/scenes/:id/preview — headless WebP of the active page (Playwright, compact). Call after content_audit ok for pixel Vision QA. Returns pngBase64 (legacy field) + mimeType image/webp; on error field, do not claim pixels were checked.',
      inputSchema: z.object({
        sceneId: z.string().min(1),
        breakpoint: z
          .enum(['mobile', 'tablet', 'desktop'])
          .optional()
          .describe('Viewport; default desktop'),
        pageId: z.string().optional().describe('Defaults to active page'),
        ...actorFields,
      }),
    },
    async (args) => {
      const { sceneId, actorUserId, actorLabel, breakpoint, pageId } = args as {
        sceneId: string
        actorUserId?: string
        actorLabel?: string
        breakpoint?: string
        pageId?: string
      }
      if (!actorUserId?.trim()) return missingActorResult()
      const params = new URLSearchParams()
      if (breakpoint) params.set('breakpoint', breakpoint)
      if (pageId?.trim()) params.set('pageId', pageId.trim())
      const qs = params.toString()
      return textResult(
        `/api/scenes/${encodeURIComponent(sceneId.trim())}/preview${qs ? `?${qs}` : ''}`,
        { zaoly: { actorUserId, actorLabel } },
      )
    },
  )

  server.registerTool(
    'zaoly.scene_craft_debug',
    {
      title: 'Scene craft debug',
      description:
        'GET /api/scenes/:id/craft-debug — compact craft bundle (craftFlags, sceneStats, designSystem, spirion). Call after import / before finishing a landing. Treat craft-thin as a must-fix (not a skip). Prefer this over scene_get for density QA.',
      inputSchema: z.object({
        sceneId: z.string().min(1),
        pageId: z.string().optional().describe('Defaults to active page'),
        ...actorFields,
      }),
    },
    async (args) => {
      const { sceneId, actorUserId, actorLabel, pageId } = args as {
        sceneId: string
        actorUserId?: string
        actorLabel?: string
        pageId?: string
      }
      if (!actorUserId?.trim()) return missingActorResult()
      const params = new URLSearchParams()
      if (pageId?.trim()) params.set('pageId', pageId.trim())
      const qs = params.toString()
      const res = await zaolyFetch(
        `/api/scenes/${encodeURIComponent(sceneId.trim())}/craft-debug${qs ? `?${qs}` : ''}`,
        { zaoly: { actorUserId, actorLabel } },
      )
      return { content: [{ type: 'text' as const, text: toTextContent(compactCraftDebugPayload(res)) }] }
    },
  )

  server.registerTool(
    'zaoly.scene_import_html',
    {
      title: 'Import HTML page',
      description:
        'POST /api/scenes/:id/import-html — convert one HTML document (inline CSS or simple .class rules in <style>) into a Site Kit page root with Hex/spacing literals (no default tokenBindings). Prefer for greenfield landings instead of many insert_child rounds. Layout: nav/header/stats rows need display:flex + flex-direction:row (inline or .class in <style>); 3-col sections → grid or row stack. Constraints: semantic sections; real text nodes; img with alt; no script/iframe. Requires baseUpdatedAt. Optional pageName → new page. Then content_audit + preview; use apply_ops only for polish.',
      inputSchema: z.object({
        sceneId: z.string().min(1),
        baseUpdatedAt: z.string().min(1).describe('Must match scene.updatedAt at load time'),
        html: z.string().min(1).describe('Full HTML document or body fragment'),
        pageName: z.string().optional().describe('If set, add_page then import into the new page'),
        pageId: z.string().optional().describe('Target page; default activePageId'),
        mode: z
          .literal('replace-page-root')
          .optional()
          .describe('v1 only replace-page-root'),
        craftMeta: z
          .object({
            spirion: z
              .object({
                captureIds: z.array(z.string()).optional(),
                lookContractSummary: z.record(z.string(), z.unknown()).optional(),
                pageRhythmSummary: z.record(z.string(), z.unknown()).optional(),
                avoid: z.array(z.string()).optional(),
              })
              .optional(),
          })
          .optional()
          .describe('Optional Spirion/craft meta stored on page craftDebug'),
        ...actorFields,
      }),
    },
    async (args) => {
      const input = args as {
        sceneId: string
        baseUpdatedAt: string
        html: string
        pageName?: string
        pageId?: string
        mode?: 'replace-page-root'
        craftMeta?: {
          spirion?: {
            captureIds?: string[]
            lookContractSummary?: Record<string, unknown>
            pageRhythmSummary?: Record<string, unknown>
            avoid?: string[]
          }
        }
        actorUserId?: string
        actorLabel?: string
      }
      if (!input.actorUserId?.trim()) return missingActorResult()
      const body: Record<string, unknown> = {
        baseUpdatedAt: input.baseUpdatedAt,
        html: input.html,
      }
      if (input.pageName?.trim()) body.pageName = input.pageName.trim()
      if (input.pageId?.trim()) body.pageId = input.pageId.trim()
      if (input.mode) body.mode = input.mode
      if (input.craftMeta) body.craftMeta = input.craftMeta
      return textResult(`/api/scenes/${encodeURIComponent(input.sceneId.trim())}/import-html`, {
        method: 'POST',
        body: JSON.stringify(body),
        zaoly: { actorUserId: input.actorUserId, actorLabel: input.actorLabel },
      })
    },
  )

  server.registerTool(
    'zaoly.scene_apply_ops',
    {
      title: 'Apply scene ops',
      description:
        'POST /api/scenes/:id/ops — atomic SceneOp[] batch. Requires baseUpdatedAt. Pass `ops` as a native JSON array of objects (not a stringified JSON string). New page/artboard: add_page {name?} (activates new page) → read response scene.root.id / tree → then insert_child/insert_instance. Also: set_active_page, rename_page, duplicate_page, delete_page, move_node_to_page, bind_master_composition {masterId,exportName}. Insert: insert_child {parentId, child:{id,type,name?,props?}} or insert_instance {masterId,parentId,index?}. Forbidden aliases: insert_node, add_instance, append_child. After 409 stale-scene refresh tree/updatedAt. After 400 op-rejected use `reason` — do not invent new op names. For greenfield landings prefer zaoly.scene_import_html first. Page as Pattern: prefer zaoly.site_kit_page_save.',
      inputSchema: z.object({
        sceneId: z.string().min(1),
        baseUpdatedAt: z.string().min(1).describe('Must match scene.updatedAt at load time'),
        ops: sceneOpsField.describe(
          'Native array of SceneOp objects. Do not wrap the array in a JSON string.',
        ),
        clientBatchId: z.string().optional().describe('Optional client batch id for logs'),
        ...actorFields,
      }),
    },
    async (args) => {
      const input = args as {
        sceneId: string
        baseUpdatedAt: string
        ops: unknown[]
        clientBatchId?: string
        actorUserId?: string
        actorLabel?: string
      }
      if (!input.actorUserId?.trim()) return missingActorResult()
      const body: Record<string, unknown> = {
        baseUpdatedAt: input.baseUpdatedAt,
        ops: input.ops,
      }
      if (input.clientBatchId?.trim()) {
        body.clientBatchId = input.clientBatchId.trim()
      }
      return textResult(`/api/scenes/${encodeURIComponent(input.sceneId.trim())}/ops`, {
        method: 'POST',
        body: JSON.stringify(body),
        zaoly: { actorUserId: input.actorUserId, actorLabel: input.actorLabel },
      })
    },
  )

  server.registerTool(
    'zaoly.editor_palette',
    {
      title: 'Editor palette',
      description:
        'GET /api/editor/palette — insertable types, seedProps, contentHint, container policy. Prefer Site Kit for PDP/marketing; override seedProps with real labels/options/placeholders.',
      inputSchema: z.object({
        ...actorFields,
      }),
    },
    async (args) => {
      const { actorUserId, actorLabel } = args as {
        actorUserId?: string
        actorLabel?: string
      }
      if (!actorUserId?.trim()) return missingActorResult()
      return textResult('/api/editor/palette', {
        zaoly: { actorUserId, actorLabel },
      })
    },
  )

  server.registerTool(
    'zaoly.brand_tokens_get',
    {
      title: 'Brand tokens',
      description:
        'GET /api/brand-tokens?platformProjectId= — active Brandion pack. Call early on scene builds; use returned paths in set_token_binding (background/color/radius/gap/…). Site Kit insert defaults are fixture only — not Collection brand.',
      inputSchema: z.object({
        platformProjectId: z.string().optional().describe('Plexon Collection id'),
        ...actorFields,
      }),
    },
    async (args) => {
      const { platformProjectId, actorUserId, actorLabel } = args as {
        platformProjectId?: string
        actorUserId?: string
        actorLabel?: string
      }
      if (!actorUserId?.trim()) return missingActorResult()
      const params = new URLSearchParams()
      if (platformProjectId?.trim()) {
        params.set('platformProjectId', platformProjectId.trim())
      }
      const qs = params.toString()
      return textResult(`/api/brand-tokens${qs ? `?${qs}` : ''}`, {
        zaoly: { actorUserId, actorLabel },
      })
    },
  )

  server.registerTool(
    'zaoly.site_kit_composition_save',
    {
      title: 'Save Site Kit composition',
      description:
        'Publish a Site Kit composition to Storybook. Prefer sceneId+masterId (expands Instances server-side); raw root is an escape hatch.',
      inputSchema: z.object({
        name: z.string().min(1),
        sceneId: z.string().optional().describe('Scene id — use with masterId for agent path'),
        masterId: z.string().optional().describe('Master id on the scene'),
        instanceNodeId: z
          .string()
          .optional()
          .describe('Optional specific Instance node id when multiple exist'),
        root: z.record(z.string(), z.unknown()).optional().describe('Raw SiteKitCompositionNode root'),
        variants: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              composition: z.record(z.string(), z.unknown()),
            }),
          )
          .optional(),
        defaultVariantId: z.string().optional(),
        ...actorFields,
      }),
    },
    async (args) => {
      const input = args as {
        name: string
        sceneId?: string
        masterId?: string
        instanceNodeId?: string
        root?: Record<string, unknown>
        variants?: { id: string; name: string; composition: Record<string, unknown> }[]
        defaultVariantId?: string
        actorUserId?: string
        actorLabel?: string
      }
      if (!input.actorUserId?.trim()) return missingActorResult()
      if (input.sceneId?.trim() && input.masterId?.trim()) {
        const body: Record<string, unknown> = {
          name: input.name,
          sceneId: input.sceneId.trim(),
          masterId: input.masterId.trim(),
        }
        if (input.instanceNodeId?.trim()) {
          body.instanceNodeId = input.instanceNodeId.trim()
        }
        return textResult('/api/site-kit/compositions/from-scene', {
          method: 'POST',
          body: JSON.stringify(body),
          zaoly: { actorUserId: input.actorUserId, actorLabel: input.actorLabel },
        })
      }
      if (!input.root || typeof input.root !== 'object') {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'invalid-input',
                message: 'Provide sceneId+masterId or a raw root object',
              }),
            },
          ],
        }
      }
      const body: Record<string, unknown> = {
        name: input.name,
        root: input.root,
      }
      if (input.variants?.length) {
        body.variants = input.variants
        if (input.defaultVariantId) body.defaultVariantId = input.defaultVariantId
      }
      return textResult('/api/site-kit/compositions', {
        method: 'POST',
        body: JSON.stringify(body),
        zaoly: { actorUserId: input.actorUserId, actorLabel: input.actorLabel },
      })
    },
  )

  server.registerTool(
    'zaoly.site_kit_page_save',
    {
      title: 'Save page as Pattern',
      description:
        'POST /api/site-kit/compositions/from-page — save the active page (or allPages) as a Collection Site Kit Pattern. Persists the bound scene. Requires Collection bind. Prefer over manual create_master + composition_save. Then polish via apply_ops; bind_master_composition is allowed if a follow-up bind is needed.',
      inputSchema: z.object({
        sceneId: z.string().min(1),
        pageId: z.string().optional().describe('Defaults to active page'),
        name: z.string().optional().describe('PascalCase Pattern name; default from page title'),
        allPages: z.boolean().optional().describe('Save every page as its own Pattern'),
        breakpoint: z
          .enum(['mobile', 'tablet', 'desktop'])
          .optional()
          .describe('Serialize breakpoint; default active'),
        ...actorFields,
      }),
    },
    async (args) => {
      const input = args as {
        sceneId: string
        pageId?: string
        name?: string
        allPages?: boolean
        breakpoint?: string
        actorUserId?: string
        actorLabel?: string
      }
      if (!input.actorUserId?.trim()) return missingActorResult()
      const body: Record<string, unknown> = { sceneId: input.sceneId.trim() }
      if (input.pageId?.trim()) body.pageId = input.pageId.trim()
      if (input.name?.trim()) body.name = input.name.trim()
      if (input.allPages === true) body.allPages = true
      if (input.breakpoint) body.breakpoint = input.breakpoint
      const res = await zaolyFetch('/api/site-kit/compositions/from-page', {
        method: 'POST',
        body: JSON.stringify(body),
        zaoly: { actorUserId: input.actorUserId, actorLabel: input.actorLabel },
      })
      return { content: [{ type: 'text' as const, text: toTextContent(compactPageSavePayload(res)) }] }
    },
  )

}
