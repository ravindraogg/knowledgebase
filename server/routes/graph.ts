import { Router } from "express"
import { query } from "../db"
import { requireAuth, type AuthedRequest } from "../auth"
import { mapNode, mapEdge } from "../mappers"

export const graphRouter = Router()

graphRouter.use(requireAuth)

// GET /api/graph — full knowledge graph for the org.
graphRouter.get("/", async (req: AuthedRequest, res) => {
  const orgId = req.auth!.orgId
  const [nodes, edges] = await Promise.all([
    query(`select * from graph_nodes where org_id = $1`, [orgId]),
    query(`select * from graph_edges where org_id = $1`, [orgId]),
  ])
  res.json({ nodes: nodes.map(mapNode), edges: edges.map(mapEdge) })
})
