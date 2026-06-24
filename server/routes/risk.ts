import { Router } from "express"
import { query } from "../db"
import { requireAuth, type AuthedRequest } from "../auth"
import { mapRisk } from "../mappers"

export const riskRouter = Router()

riskRouter.use(requireAuth)

// GET /api/risk — module bus-factor / knowledge-concentration metrics.
riskRouter.get("/", async (req: AuthedRequest, res) => {
  const rows = await query(
    `select * from module_risks where org_id = $1 order by bus_factor asc, knowledge_concentration desc`,
    [req.auth!.orgId],
  )
  res.json(rows.map(mapRisk))
})
