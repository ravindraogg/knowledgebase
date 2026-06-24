import { Router } from "express"
import { query } from "../db"
import { requireAuth, requireRole, type AuthedRequest } from "../auth"
import { mapMember } from "../mappers"

export const membersRouter = Router()

membersRouter.use(requireAuth)

// GET /api/members
membersRouter.get("/", async (req: AuthedRequest, res) => {
  const rows = await query(
    `select m.*, u.email, u.name, u.avatar_url
       from organization_members m
       join users u on u.id = m.user_id
      where m.org_id = $1
      order by m.joined_at asc`,
    [req.auth!.orgId],
  )
  res.json(rows.map(mapMember))
})

// PATCH /api/members/:id  — change role (admin only)
membersRouter.patch("/:id", requireRole("admin"), async (req: AuthedRequest, res) => {
  const { role } = req.body ?? {}
  if (!["admin", "engineer", "viewer"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" })
  }
  const rows = await query(
    `update organization_members set role = $3
      where id = $1 and org_id = $2
      returning *`,
    [req.params.id, req.auth!.orgId, role],
  )
  if (!rows[0]) return res.status(404).json({ error: "Member not found" })

  const full = await query(
    `select m.*, u.email, u.name, u.avatar_url
       from organization_members m join users u on u.id = m.user_id
      where m.id = $1`,
    [rows[0].id],
  )
  res.json(mapMember(full[0]))
})
