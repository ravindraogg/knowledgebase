import { Router } from "express"
import { query } from "../db"
import { requireAuth, requireRole, type AuthedRequest } from "../auth"
import { mapConnector } from "../mappers"

export const connectorsRouter = Router()

connectorsRouter.use(requireAuth)

const TYPES = ["github", "jira", "slack"] as const

// GET /api/connectors — returns a row for every connector type, creating
// disconnected placeholders the first time an org views the page.
connectorsRouter.get("/", async (req: AuthedRequest, res) => {
  const orgId = req.auth!.orgId
  for (const type of TYPES) {
    await query(
      `insert into connectors (org_id, type, status) values ($1, $2, 'disconnected')
       on conflict (org_id, type) do nothing`,
      [orgId, type],
    )
  }
  const rows = await query(
    `select * from connectors where org_id = $1 order by type asc`,
    [orgId],
  )
  res.json(rows.map(mapConnector))
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
  } else {
    return res.status(400).json({ error: "Invalid action" })
  }

  if (!rows[0]) return res.status(404).json({ error: "Connector not found" })
  res.json(mapConnector(rows[0]))
})
