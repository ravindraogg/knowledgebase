# Recalix — Project Context

> Feed this file to your build agent as system/project context. It defines what Recalix is, the current stack, architecture, data models, and build priorities. Keep this file updated as decisions change — it is the source of truth, not the pitch deck.

---

## 1. What Recalix Is

Recalix is a knowledge-graph platform that captures **why code exists**, not just what it does. It ingests a company's GitHub commit history, Jira tickets, and Slack discussions, parses the codebase into an Abstract Syntax Tree (AST), and builds a graph linking every function/file/module to the commits, tickets, and conversations that shaped it. Engineers query it in natural language ("why does this function exist," "what broke last time we touched this") and get a traceable answer with sources attached — not a guess.

**Differentiation:** India-first, on-premise/BYOC deployment, DPDP Act compliance, built for legacy/undocumented codebases (the norm in Indian IT services), vs. competitors (Unblocked, Augment Code) who assume clean, well-documented, US-enterprise codebases.

**Current stage:** Architecture defined, no code written yet. This file exists to take the project from concept to a working single-repo prototype.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **Next.js** (App Router) | Dashboard, query UI, ingestion config |
| Backend / API | **Node.js** (Express or Next.js API routes/route handlers) | Decide: standalone Express service vs. Next.js API routes — see Open Decisions |
| Application data | **MongoDB** | Users, orgs, ingestion configs, API keys, audit logs, query history — anything document-shaped and not graph-shaped |
| Knowledge graph | **Neo4j** | Code entities (functions, files, modules) + commits + tickets + discussion nodes, and the edges between them. This is the core differentiator — do not substitute with a relational or document model |
| Code parsing | **AST parser** (language-dependent — e.g. `@babel/parser`/`ts-morph` for JS/TS, `ast` module for Python) | Produces the nodes/edges fed into Neo4j |
| Auth | TBD — likely NextAuth.js or custom JWT | Needs to support org-level screen eventually |
| Deployment target | **Cloud (dev) → On-prem/BYOC (enterprise tier)** | Containerize everything (Docker) from day one so on-prem is a deployment target, not a rewrite |

**Not yet decided (flag to agent, don't assume):**
- Express standalone vs. Next.js API routes for backend
- Vector/embedding store for semantic search over discussions (if added later — FAISS, pgvector, or Neo4j vector index)
- Job queue for ingestion (BullMQ + Redis is the default assumption if one is needed)

---

## 3. Core Data Sources & Ingestion

| Source | What's pulled | Priority |
|---|---|---|
| GitHub | Commits, diffs, PR descriptions, PR review comments | P0 — build first |
| Jira | Tickets, ticket descriptions, linked commits | P1 |
| Slack | Threads referencing commits/tickets/files | P2 — most complex, do last |

Ingestion should be **incremental/rolling**, not one-time batch — design the schema and job structure assuming continuous sync from day one, even if the prototype only does a manual trigger.

---

## 4. Data Model Sketch

### MongoDB (application layer)
- `organizations` — org metadata, deployment tier (Starter/Growth/Enterprise), DPDP compliance flags
- `users` — auth, org membership, role
- `integrations` — connected GitHub/Jira/Slack credentials per org (encrypted at rest — non-negotiable given DPDP positioning)
- `ingestion_runs` — job status, last sync timestamp per source
- `query_logs` — user queries + which graph nodes were returned (useful for both UX and eventual fine-tuning)

### Neo4j (graph layer)
**Node types:**
- `CodeEntity` (function, file, module) — parsed via AST, has path, language, signature
- `Commit` — hash, message, author, timestamp
- `Ticket` — Jira ID, title, status
- `Discussion` — Slack thread/message, timestamp, participants

**Relationship types (starting set):**
- `(Commit)-[:MODIFIES]->(CodeEntity)`
- `(Commit)-[:REFERENCES]->(Ticket)`
- `(Discussion)-[:DISCUSSES]->(CodeEntity | Ticket | Commit)`
- `(CodeEntity)-[:DEPENDS_ON]->(CodeEntity)` — from AST analysis, not from history

This is a starting sketch, not final schema — expect it to change once real repo data is run through the parser.

---

## 5. Build Priority Order (matches the pitch deck roadmap)

1. **AST parser → Neo4j loader** for a single GitHub repo (no Jira/Slack yet). Prove the core "why does this exist" query works end-to-end on one codebase.
2. **GitHub ingestion pipeline** — commits + PRs, incremental sync, written to Mongo (job metadata) + Neo4j (graph data).
3. **Query interface** — Next.js frontend, natural-language input → graph query → traceable answer with source links.
4. **Jira ingestion**, then **Slack ingestion** — in that order, Slack last because thread-to-code linking is the hardest matching problem.
5. **Auth + org/RBAC layer** — needed before any real pilot, not needed for solo-repo demo.
6. **On-prem/BYOC packaging** (Docker Compose or Helm chart) + DPDP compliance documentation — Enterprise-tier requirement, not a prototype requirement.

Don't let the agent jump ahead to auth, billing, or multi-tenant polish before step 1 works on one real repo. The whole pitch depends on the graph answering questions correctly, not on the app being feature-complete.

---

## 6. Known Risks / Things Not to Paper Over

- No confirmed design partner yet — the "6-month pilot" milestone in the deck is a target, not a signed commitment.
- Slack-to-code linking (matching a casual thread to a specific function/commit) is an unsolved matching problem, not just an integration — expect it to need its own scoring/confidence logic, not a simple keyword join.
- Legacy/undocumented codebases (your stated wedge) are exactly the codebases where AST parsing is hardest (inconsistent structure, dead code, mixed language versions) — the prototype should be tested against a genuinely messy repo, not a clean one, or the demo will overstate how solved the problem is.
- Encryption-at-rest for third-party credentials (`integrations` collection) needs to be real, not a placeholder, given DPDP compliance is a stated selling point — don't ship plaintext tokens even in the prototype.

---