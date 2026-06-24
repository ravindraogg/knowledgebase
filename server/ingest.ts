import { query } from "./db"

// Representative engineering history seeded when a connector is first linked.
// In production this is replaced by real GitHub/Jira/Slack ingestion; here it
// gives every connector a meaningful, queryable corpus scoped to the org.

interface NodeSeed {
  key: string
  type: "person" | "code" | "decision" | "work_item"
  label: string
  metadata?: { label: string; value: string }[]
}

interface EdgeSeed {
  source: string
  target: string
  relationshipType: string
}

interface DocSeed {
  kind: "pr" | "slack" | "function" | "jira" | "adr"
  title: string
  meta: string
  body: string
  language?: string
  nodeKey?: string
}

interface RiskSeed {
  moduleName: string
  busFactor: number
  primaryOwner: string
  knowledgeConcentration: number
  contributors: { name: string; share: number }[]
  lastUpdated: string
}

const GITHUB_NODES: NodeSeed[] = [
  { key: "p_maya", type: "person", label: "Maya Chen", metadata: [{ label: "Role", value: "Staff Engineer" }] },
  { key: "p_dev", type: "person", label: "Devraj Patel", metadata: [{ label: "Role", value: "Senior Engineer" }] },
  { key: "p_lena", type: "person", label: "Lena Ortiz", metadata: [{ label: "Role", value: "Engineer" }] },
  { key: "c_auth", type: "code", label: "auth/session.ts", metadata: [{ label: "Module", value: "Authentication" }] },
  { key: "c_pay", type: "code", label: "payments/refund.ts", metadata: [{ label: "Module", value: "Payments" }] },
  { key: "d_jwt", type: "decision", label: "Migrate to rotating JWTs" },
]

const GITHUB_EDGES: EdgeSeed[] = [
  { source: "p_maya", target: "c_auth", relationshipType: "authored" },
  { source: "p_maya", target: "d_jwt", relationshipType: "decided" },
  { source: "p_dev", target: "c_pay", relationshipType: "authored" },
  { source: "p_lena", target: "c_auth", relationshipType: "reviewed" },
  { source: "d_jwt", target: "c_auth", relationshipType: "implemented_by" },
]

const GITHUB_DOCS: DocSeed[] = [
  {
    kind: "pr",
    title: "PR #482: Rotate session JWTs every 15 minutes",
    meta: "Merged by Maya Chen · auth/session.ts",
    nodeKey: "c_auth",
    body: "Maya Chen owns the authentication module. This PR introduces rotating JWTs with a 15-minute access token and a 7-day refresh token, replacing the long-lived session cookies. Reviewed by Lena Ortiz. The rotation logic lives in auth/session.ts.",
  },
  {
    kind: "function",
    title: "auth/session.ts — refreshSession()",
    meta: "Owner: Maya Chen",
    language: "typescript",
    nodeKey: "c_auth",
    body: "export async function refreshSession(token: string) {\n  const claims = verify(token, SECRET)\n  if (Date.now() > claims.exp) return null\n  return issue({ sub: claims.sub }, { expiresIn: '15m' })\n}",
  },
  {
    kind: "pr",
    title: "PR #517: Idempotent refund processing",
    meta: "Merged by Devraj Patel · payments/refund.ts",
    nodeKey: "c_pay",
    body: "Devraj Patel is the primary owner of the payments/refund module. This change makes refunds idempotent by keying on the Stripe refund id, fixing duplicate refund issues reported in incident INC-204.",
  },
]

const GITHUB_RISKS: RiskSeed[] = [
  {
    moduleName: "Authentication",
    busFactor: 1,
    primaryOwner: "Maya Chen",
    knowledgeConcentration: 86,
    contributors: [
      { name: "Maya Chen", share: 86 },
      { name: "Lena Ortiz", share: 14 },
    ],
    lastUpdated: "2026-05-30",
  },
  {
    moduleName: "Payments",
    busFactor: 2,
    primaryOwner: "Devraj Patel",
    knowledgeConcentration: 64,
    contributors: [
      { name: "Devraj Patel", share: 64 },
      { name: "Maya Chen", share: 36 },
    ],
    lastUpdated: "2026-06-12",
  },
]

const JIRA_NODES: NodeSeed[] = [
  { key: "w_204", type: "work_item", label: "INC-204: Duplicate refunds" },
  { key: "w_330", type: "work_item", label: "AUTH-330: Session fixation hardening" },
]

const JIRA_EDGES: EdgeSeed[] = [
  { source: "w_204", target: "c_pay", relationshipType: "resolved_by" },
  { source: "w_330", target: "c_auth", relationshipType: "tracked_in" },
]

const JIRA_DOCS: DocSeed[] = [
  {
    kind: "jira",
    title: "INC-204: Customers charged refund twice",
    meta: "Closed · Payments",
    nodeKey: "c_pay",
    body: "Incident INC-204: a retry storm caused duplicate refunds. Root cause was non-idempotent refund handling. Resolved by Devraj Patel via PR #517 by keying on the Stripe refund id.",
  },
  {
    kind: "jira",
    title: "AUTH-330: Harden against session fixation",
    meta: "In progress · Authentication",
    nodeKey: "c_auth",
    body: "AUTH-330 tracks session fixation hardening. Maya Chen scoped the work; the rotating JWT migration (PR #482) is the primary mitigation.",
  },
]

const SLACK_DOCS: DocSeed[] = [
  {
    kind: "slack",
    title: "#eng-decisions: Why rotating JWTs",
    meta: "Thread · 23 replies",
    nodeKey: "d_jwt",
    body: "Maya Chen: 'We're moving to rotating JWTs because long-lived cookies were our biggest session-hijack surface. 15m access + 7d refresh. Decision recorded in ADR-09.' Devraj Patel and Lena Ortiz approved.",
  },
  {
    kind: "adr",
    title: "ADR-09: Rotating JWT session strategy",
    meta: "Accepted · 2026-05-28",
    nodeKey: "d_jwt",
    body: "Context: session cookies were long-lived and vulnerable to hijacking. Decision: adopt rotating JWTs (15m access, 7d refresh) with server-side refresh rotation. Owner: Maya Chen. Status: Accepted.",
  },
]

const SEED: Record<string, { nodes: NodeSeed[]; edges: EdgeSeed[]; docs: DocSeed[]; risks: RiskSeed[] }> = {
  github: { nodes: GITHUB_NODES, edges: GITHUB_EDGES, docs: GITHUB_DOCS, risks: GITHUB_RISKS },
  jira: { nodes: JIRA_NODES, edges: JIRA_EDGES, docs: JIRA_DOCS, risks: [] },
  slack: { nodes: [], edges: [], docs: SLACK_DOCS, risks: [] },
}

/**
 * Ingest representative data for a connector into the org's memory graph.
 * Idempotent per (org, label) so reconnecting/syncing doesn't duplicate rows.
 */
export async function ingestConnectorData(orgId: string, type: string): Promise<void> {
  const plan = SEED[type]
  if (!plan) return

  // Resolve node keys -> ids, inserting nodes that don't exist yet.
  const idByKey = new Map<string, string>()

  async function ensureNode(seed: NodeSeed): Promise<string> {
    if (idByKey.has(seed.key)) return idByKey.get(seed.key)!
    const existing = await query<{ id: string }>(
      `select id from graph_nodes where org_id = $1 and label = $2 limit 1`,
      [orgId, seed.label],
    )
    if (existing[0]) {
      idByKey.set(seed.key, existing[0].id)
      return existing[0].id
    }
    const inserted = await query<{ id: string }>(
      `insert into graph_nodes (org_id, type, label, metadata)
       values ($1, $2, $3, $4) returning id`,
      [orgId, seed.type, seed.label, JSON.stringify(seed.metadata ?? [])],
    )
    idByKey.set(seed.key, inserted[0].id)
    return inserted[0].id
  }

  // Build a lookup of every node referenced across this org's seed plans so
  // edges/docs from one connector can reference nodes created by another.
  const allNodeSeeds = [...GITHUB_NODES, ...JIRA_NODES]
  const nodeSeedByKey = new Map(allNodeSeeds.map((n) => [n.key, n]))

  for (const n of plan.nodes) await ensureNode(n)

  for (const e of plan.edges) {
    const sourceSeed = nodeSeedByKey.get(e.source)
    const targetSeed = nodeSeedByKey.get(e.target)
    if (!sourceSeed || !targetSeed) continue
    const sourceId = await ensureNode(sourceSeed)
    const targetId = await ensureNode(targetSeed)
    const dup = await query(
      `select 1 from graph_edges
        where org_id = $1 and source_id = $2 and target_id = $3 and relationship_type = $4`,
      [orgId, sourceId, targetId, e.relationshipType],
    )
    if (dup.length === 0) {
      await query(
        `insert into graph_edges (org_id, source_id, target_id, relationship_type)
         values ($1, $2, $3, $4)`,
        [orgId, sourceId, targetId, e.relationshipType],
      )
    }
  }

  for (const d of plan.docs) {
    const dup = await query(`select 1 from documents where org_id = $1 and title = $2`, [orgId, d.title])
    if (dup.length > 0) continue
    let nodeId: string | null = null
    if (d.nodeKey) {
      const seed = nodeSeedByKey.get(d.nodeKey)
      if (seed) nodeId = await ensureNode(seed)
    }
    await query(
      `insert into documents (org_id, kind, title, meta, body, language, node_id)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, d.kind, d.title, d.meta, d.body, d.language ?? null, nodeId],
    )
  }

  for (const r of plan.risks) {
    const dup = await query(`select 1 from module_risks where org_id = $1 and module_name = $2`, [orgId, r.moduleName])
    if (dup.length > 0) continue
    await query(
      `insert into module_risks (org_id, module_name, bus_factor, primary_owner, knowledge_concentration, contributors, last_updated)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [orgId, r.moduleName, r.busFactor, r.primaryOwner, r.knowledgeConcentration, JSON.stringify(r.contributors), r.lastUpdated],
    )
  }
}
