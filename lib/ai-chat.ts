// STUB: Replace with real implementation — see project notes.
// Returns canned responses with fake citations and a decision trail. Will later
// call an LLM with GraphRAG context retrieved from the knowledge graph.

import type { ChatMessage, Citation, DecisionTrailStep } from './types'

interface CannedResponse {
  match: RegExp
  content: string
  citations?: Citation[]
  decisionTrail?: DecisionTrailStep[]
}

const PR_892_CITATION: Citation = {
  id: 'cit_pr892',
  kind: 'pr',
  label: 'PR #892',
  source: {
    title: 'PR #892 — Migrate sessions to rotating JWT',
    meta: 'acme-eng/platform · merged 2026-05-18 · +214 −98',
    language: 'diff',
    body: `- const session = await store.get(sessionId)
- if (!session) throw new Unauthorized()
+ const claims = verifyJwt(token, { rotate: true })
+ if (claims.exp < now()) {
+   // rotate refresh token; see ADR-12 for rationale
+   return rotateSession(claims)
+ }`,
  },
}

const SLACK_CITATION: Citation = {
  id: 'cit_slack',
  kind: 'slack',
  label: 'Slack #payments',
  source: {
    title: '#payments — Refund race condition',
    meta: 'Slack thread · 2026-05-29 · 7 replies',
    body: `marcus.li: refunds are double-firing when the webhook retries
priya.nair: yeah the idempotency key isn't being persisted before the ack
marcus.li: right — we ack then write. need to flip the order
priya.nair: that's basically PAY-128. let's gate on the idempotency key
marcus.li: 👍 will open a PR (this became #905)`,
  },
}

const FN_CITATION: Citation = {
  id: 'cit_fn',
  kind: 'function',
  label: 'processPayment()',
  source: {
    title: 'payments/processPayment()',
    meta: 'payments/process.ts · last modified in PR #905',
    language: 'typescript',
    body: `export async function processPayment(req: PaymentRequest) {
  // idempotency added in PR #905 to fix PAY-128 (duplicate charge on retry)
  const existing = await ledger.find(req.idempotencyKey)
  if (existing) return existing
  return ledger.charge(req)
}`,
  },
}

const ADR_CITATION: Citation = {
  id: 'cit_adr12',
  kind: 'adr',
  label: 'ADR-12',
  source: {
    title: 'ADR-12 — Choose stateless auth strategy',
    meta: 'Architecture Decision Record · Accepted · Sarah Chen',
    body: `Context: server-side session store became a scaling bottleneck.
Decision: adopt stateless rotating JWTs with short TTLs.
Consequences: removes the session DB; requires careful token rotation
(implemented in auth/tokenRotation.ts, rolled out via AUTH-90).`,
  },
}

const RESPONSES: CannedResponse[] = [
  {
    match: /why.*(function|code|exist|processpayment)/i,
    content:
      "The `processPayment()` function exists to guarantee **idempotent charges**. It was introduced because retries from the payment webhook were occasionally double-charging customers (tracked as PAY-128). Marcus Li flagged the race condition in Slack, and the fix landed in PR #905 — it now checks the idempotency key against the ledger before charging.",
    citations: [FN_CITATION, SLACK_CITATION],
    decisionTrail: [
      { id: 't1', label: 'PAY-128', type: 'work_item' },
      { id: 't2', label: 'Slack #payments', type: 'decision' },
      { id: 't3', label: 'PR #905', type: 'decision' },
      { id: 't4', label: 'Code Review', type: 'event' },
      { id: 't5', label: 'Merged', type: 'event' },
    ],
  },
  {
    match: /who.*(know|expert|authentication|auth|owns)/i,
    content:
      "**Sarah Chen** holds the most knowledge about authentication — roughly **68% of the auth module's** architectural decisions trace back to her. She authored `auth/session.ts` and `auth/tokenRotation.ts` and wrote ADR-12 defining the stateless auth strategy. This is also a bus-factor risk: Diego Ramos is the only secondary reviewer at ~18% coverage.",
    citations: [ADR_CITATION, PR_892_CITATION],
    decisionTrail: [
      { id: 't1', label: 'Sarah Chen', type: 'person' },
      { id: 't2', label: 'ADR-12', type: 'decision' },
      { id: 't3', label: 'auth/session.ts', type: 'code' },
    ],
  },
  {
    match: /(what changed|changed.*payment|payments last month|last month)/i,
    content:
      "In the last month, Payments saw three notable changes: PR #905 made `processPayment()` idempotent (fixing PAY-128), the refund engine was hardened after a race condition discussed in #payments, and PAY-140 began adding webhook signature verification (still in progress, owned by Priya Nair).",
    citations: [FN_CITATION, SLACK_CITATION],
    decisionTrail: [
      { id: 't1', label: 'PAY-128', type: 'work_item' },
      { id: 't2', label: 'PR #905', type: 'decision' },
      { id: 't3', label: 'PAY-140', type: 'work_item' },
    ],
  },
  {
    match: /(bus factor|risk|offboard)/i,
    content:
      "The highest bus-factor risk is the **Authentication System** (bus factor: 1). 68% of its knowledge is concentrated in Sarah Chen, with no strong secondary owner. Payments Core is moderate (bus factor: 2, Marcus Li at 54%). I'd recommend pairing Diego Ramos into auth reviews to reduce single-owner exposure.",
    citations: [ADR_CITATION, PR_892_CITATION],
    decisionTrail: [
      { id: 't1', label: 'Authentication System', type: 'code' },
      { id: 't2', label: 'Sarah Chen', type: 'person' },
      { id: 't3', label: 'Bus factor: 1', type: 'event' },
    ],
  },
]

const FALLBACK: CannedResponse = {
  match: /.*/,
  content:
    "Here's what I found in your engineering memory. This is a seeded demo response — once the GraphRAG backend is connected, I'll answer from your real GitHub, Jira, and Slack history with linked citations and a decision trail. Try one of the suggested questions to see a richer answer.",
  citations: [PR_892_CITATION],
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export async function getChatResponse(
  orgId: string,
  message: string,
  history: ChatMessage[] = [],
): Promise<ChatMessage> {
  void orgId
  void history
  const picked = RESPONSES.find((r) => r.match.test(message)) ?? FALLBACK
  return {
    id: uid(),
    role: 'assistant',
    content: picked.content,
    citations: picked.citations,
    decisionTrail: picked.decisionTrail,
    createdAt: new Date().toISOString(),
  }
}

export const STARTER_PROMPTS = [
  'Why does this function exist?',
  'Who knows the most about authentication?',
  'What changed in payments last month?',
  'Show me the bus factor for this repo',
]
