import { Router } from "express"
import { query } from "../db"
import { requireAuth, requireRole, type AuthedRequest } from "../auth"
import { mapOrg } from "../mappers"

export const orgRouter = Router()

orgRouter.use(requireAuth)

// GET /api/org
orgRouter.get("/", async (req: AuthedRequest, res) => {
  const rows = await query(`select * from organizations where id = $1`, [req.auth!.orgId])
  if (!rows[0]) return res.status(404).json({ error: "Organization not found" })
  res.json(mapOrg(rows[0]))
})

// PATCH /api/org  (admin only)
orgRouter.patch("/", requireRole("admin"), async (req: AuthedRequest, res) => {
  const { name, deploymentMode } = req.body ?? {}
  const rows = await query(
    `update organizations
        set name = coalesce($2, name),
            deployment_mode = coalesce($3, deployment_mode)
      where id = $1
      returning *`,
    [req.auth!.orgId, name ?? null, deploymentMode ?? null],
  )
  res.json(mapOrg(rows[0]))
})
