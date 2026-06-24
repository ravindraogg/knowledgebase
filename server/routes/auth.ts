import { Router } from "express"
import { query, withTransaction } from "../db"
import {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
  type AuthedRequest,
} from "../auth"
import { mapOrg, mapMember } from "../mappers"

export const authRouter = Router()

// POST /api/auth/signup — creates a user, a new org, and an admin membership.
authRouter.post("/signup", async (req, res) => {
  const { email, name, password, orgName } = req.body ?? {}
  if (!email || !name || !password || !orgName) {
    return res.status(400).json({ error: "email, name, password and orgName are required" })
  }

  const existing = await query(`select id from users where lower(email) = lower($1)`, [email])
  if (existing.length > 0) {
    return res.status(409).json({ error: "An account with this email already exists" })
  }

  try {
    const result = await withTransaction(async (client) => {
      const userRows = (
        await client.query(
          `insert into users (email, name, password_hash) values ($1, $2, $3) returning *`,
          [email, name, hashPassword(password)],
        )
      ).rows
      const user = userRows[0]

      const orgRows = (
        await client.query(`insert into organizations (name) values ($1) returning *`, [orgName])
      ).rows
      const org = orgRows[0]

      const memberRows = (
        await client.query(
          `insert into organization_members (org_id, user_id, role)
           values ($1, $2, 'admin') returning *`,
          [org.id, user.id],
        )
      ).rows
      const member = memberRows[0]

      return { user, org, member }
    })

    const member = mapMember({
      ...result.member,
      user_id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      avatar_url: result.user.avatar_url,
    })
    const token = signToken({
      userId: result.user.id,
      orgId: result.org.id,
      memberId: result.member.id,
      role: "admin",
    })
    res.json({ token, org: mapOrg(result.org), member })
  } catch (err: any) {
    console.error("[v0] signup error:", err.message)
    res.status(500).json({ error: "Failed to create account" })
  }
})

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" })
  }

  const rows = await query(
    `select m.*, u.email, u.name, u.avatar_url, u.password_hash, o.id as org_id,
            o.name as org_name, o.deployment_mode, o.created_at as org_created_at
       from organization_members m
       join users u on u.id = m.user_id
       join organizations o on o.id = m.org_id
      where lower(u.email) = lower($1)
      order by m.joined_at asc
      limit 1`,
    [email],
  )

  const row = rows[0]
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" })
  }

  const token = signToken({
    userId: row.user_id,
    orgId: row.org_id,
    memberId: row.id,
    role: row.role,
  })
  res.json({
    token,
    org: mapOrg({
      id: row.org_id,
      name: row.org_name,
      deployment_mode: row.deployment_mode,
      created_at: row.org_created_at,
    }),
    member: mapMember(row),
  })
})

// GET /api/auth/me — resolve the current session from the token.
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const { orgId, memberId } = req.auth!
  const rows = await query(
    `select m.*, u.email, u.name, u.avatar_url, o.name as org_name,
            o.deployment_mode, o.created_at as org_created_at
       from organization_members m
       join users u on u.id = m.user_id
       join organizations o on o.id = m.org_id
      where m.id = $1 and m.org_id = $2`,
    [memberId, orgId],
  )
  const row = rows[0]
  if (!row) return res.status(404).json({ error: "Session not found" })

  res.json({
    org: mapOrg({
      id: orgId,
      name: row.org_name,
      deployment_mode: row.deployment_mode,
      created_at: row.org_created_at,
    }),
    member: mapMember(row),
  })
})
