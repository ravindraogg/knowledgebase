import { Router } from "express"
import { query } from "../db"
import { requireAuth, requireRole, type AuthedRequest } from "../auth"
import { mapConnector } from "../mappers"
import { ingestConnectorData } from "../ingest"

export const connectorsRouter = Router()

connectorsRouter.use(requireAuth)

const TYPES = ["github", "jira", "slack"] as const

// Read-only scope presets seeded for each connector type so the consent dialog
// and card details render before any real OAuth round-trip occurs.
const SCOPE_PRESETS: Record<string, { summary: string; scopes: string[]; details: { label: string; value: string }[] }> = {
  github: {
    summary: "Read-only access to pull requests, commits, and reviews.",
    scopes: ["repo:read", "pull_requests:read", "commits:read", "members:read"],
    details: [
      { label: "Data", value: "PRs, commits, reviews" },
      { label: "Access", value: "Read-only" },
    ],
  },
  jira: {
    summary: "Read-only access to issues, tickets, and project history.",
    scopes: ["issues:read", "projects:read", "comments:read"],
    details: [
      { label: "Data", value: "Issues, tickets, comments" },
      { label: "Access", value: "Read-only" },
    ],
  },
  slack: {
    summary: "Read-only access to public channel discussions.",
    scopes: ["channels:history", "channels:read", "users:read"],
    details: [
      { label: "Data", value: "Public channels only" },
      { label: "Access", value: "Read-only" },
    ],
  },
}

// GET /api/connectors — returns a row for every connector type, creating
// disconnected placeholders (with read-only scope presets) the first time
// an org views the page.
connectorsRouter.get("/", async (req: AuthedRequest, res) => {
  const orgId = req.auth!.orgId
  for (const type of TYPES) {
    await query(
      `insert into connectors (org_id, type, status, scope_config) values ($1, $2, 'disconnected', $3)
       on conflict (org_id, type) do update set scope_config = excluded.scope_config
       where connectors.scope_config = '{}'::jsonb`,
      [orgId, type, JSON.stringify(SCOPE_PRESETS[type])],
    )
  }
  const rows = await query(
    `select * from connectors where org_id = $1 order by type asc`,
    [orgId],
  )
  res.json({ connectors: rows.map(mapConnector) })
})

// POST /api/connectors/:type — connect / disconnect / sync (admin only)
connectorsRouter.post("/:type", requireRole("admin"), async (req: AuthedRequest, res) => {
  const orgId = req.auth!.orgId
  const type = req.params.type
  const { action, scopeConfig } = req.body ?? {}
  if (!TYPES.includes(type as any)) {
    return res.status(400).json({ error: "Unknown connector type" })
  }

  let rows
  if (action === "connect") {
    rows = await query(
      `update connectors
          set status = 'connected', last_synced_at = now(),
              scope_config = coalesce($3, scope_config)
        where org_id = $1 and type = $2 returning *`,
      [orgId, type, scopeConfig ? JSON.stringify(scopeConfig) : null],
    )
    // Ingest this source's engineering history into the org's memory graph.
    await ingestConnectorData(orgId, type)
  } else if (action === "disconnect") {
    rows = await query(
      `update connectors set status = 'disconnected', last_synced_at = null
        where org_id = $1 and type = $2 returning *`,
      [orgId, type],
    )
  } else if (action === "sync") {
    rows = await query(
      `update connectors set status = 'connected', last_synced_at = now()
        where org_id = $1 and type = $2 returning *`,
      [orgId, type],
    )
    await ingestConnectorData(orgId, type)
  } else {
    return res.status(400).json({ error: "Invalid action" })
  }

  if (!rows[0]) return res.status(404).json({ error: "Connector not found" })
  res.json(mapConnector(rows[0]))
})
