/**
 * Zaoly MCP tools — proxy to the Zaoly web BFF.
 * Spec: specs/domain/mcp-server.md
 */
import { z } from 'zod'
import { type ZaolyRequestInit, zaolyFetch } from './zaoly-client.js'
import { ZAOLY_V2_TOOL_NAMES, registerZaolyV2Tools } from './tools-v2.js'

function toTextContent(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

type ToolServer = {
  registerTool: (
    name: string,
    config: { title?: string; description?: string; inputSchema?: z.ZodTypeAny },
    cb: (args: unknown) => Promise<{ content: Array<{ type: 'text'; text: string }> }>,
  ) => void
}

async function textResult(path: string, options?: ZaolyRequestInit) {
  const res = await zaolyFetch(path, options)
  return { content: [{ type: 'text' as const, text: toTextContent(res) }] }
}

export const ZAOLY_V1_TOOL_NAMES = [
  'zaoly.health',
  'zaoly.library_catalog',
  'zaoly.compositions_list',
  'zaoly.projects_list',
  'zaoly.project_get',
] as const

export const ZAOLY_TOOL_NAMES = [...ZAOLY_V1_TOOL_NAMES, ...ZAOLY_V2_TOOL_NAMES] as const

export function registerZaolyTools(server: ToolServer) {
  server.registerTool(
    'zaoly.health',
    {
      title: 'Health',
      description: 'GET /api/health — Zaoly liveness.',
      inputSchema: z.object({}),
    },
    async () => textResult('/api/health'),
  )

  server.registerTool(
    'zaoly.library_catalog',
    {
      title: 'Library catalog',
      description:
        'GET /api/library/catalog — offline fixture WC/contract snapshot (product Library hub SoT = Site Kit). Optional q (tag substring) and category filters.',
      inputSchema: z.object({
        q: z.string().optional().describe('Case-insensitive tagName substring'),
        category: z.string().optional().describe('Exact category, e.g. Atoms/Forms'),
      }),
    },
    async (args) => {
      const { q, category } = args as { q?: string; category?: string }
      const params = new URLSearchParams()
      if (q?.trim()) params.set('q', q.trim())
      if (category?.trim()) params.set('category', category.trim())
      const qs = params.toString()
      return textResult(`/api/library/catalog${qs ? `?${qs}` : ''}`)
    },
  )

  server.registerTool(
    'zaoly.compositions_list',
    {
      title: 'List compositions',
      description:
        'GET /api/compositions — CompositionSummary[] from scene-store. Optional platformProjectId. Requires session or service secret + X-Actor-User-Id when auth is on.',
      inputSchema: z.object({
        platformProjectId: z
          .string()
          .optional()
          .describe('Narrow to one Collection (ACL-checked)'),
        actorUserId: z
          .string()
          .optional()
          .describe('Required with service secret when auth is configured'),
      }),
    },
    async (args) => {
      const { platformProjectId, actorUserId } = args as {
        platformProjectId?: string
        actorUserId?: string
      }
      const params = new URLSearchParams()
      if (platformProjectId?.trim()) params.set('platformProjectId', platformProjectId.trim())
      const qs = params.toString()
      return textResult(`/api/compositions${qs ? `?${qs}` : ''}`, {
        zaoly: actorUserId?.trim() ? { actorUserId: actorUserId.trim() } : undefined,
      })
    },
  )

  server.registerTool(
    'zaoly.projects_list',
    {
      title: 'List projects',
      description:
        'GET /api/projects — project list. Requires service secret when auth is on.',
      inputSchema: z.object({}),
    },
    async () => textResult('/api/projects'),
  )

  server.registerTool(
    'zaoly.project_get',
    {
      title: 'Get project',
      description:
        'GET /api/projects/:id or ?platformProjectId= — project detail by local id or Collection id.',
      inputSchema: z.object({
        id: z.string().optional().describe('Local project id'),
        platformProjectId: z.string().optional().describe('Collection / platform project id'),
      }),
    },
    async (args) => {
      const { id, platformProjectId } = args as {
        id?: string
        platformProjectId?: string
      }
      if (platformProjectId?.trim()) {
        return textResult(
          `/api/projects?platformProjectId=${encodeURIComponent(platformProjectId.trim())}`,
        )
      }
      if (id?.trim()) {
        return textResult(`/api/projects/${encodeURIComponent(id.trim())}`)
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: toTextContent({
              error: true,
              message: 'id or platformProjectId required',
            }),
          },
        ],
      }
    },
  )

  registerZaolyV2Tools(server)
}
