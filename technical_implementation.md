# Recalix — Technical Implementation Guide

> **Purpose:** Single-source-of-truth for any agent or developer building Recalix. Covers architecture, features, every frontend route, every backend API endpoint, data models, tech stack decisions, and the phased build plan. Feed this file as context before writing any code.

---

## 1. Project Overview

Recalix is a knowledge-graph platform that captures **why code exists**. It ingests GitHub commits, Jira tickets, and Slack discussions; parses codebases into ASTs; and builds a graph linking every code entity to the decisions that shaped it. Engineers query it in natural language and get traceable answers with sources.

**Key Differentiators:**
- India-first, on-prem/BYOC deployment
- DPDP Act compliance baked in (encryption-at-rest for credentials, audit logs)
- Built for legacy/undocumented codebases (messy AST parsing, dead code handling)

---

## 2. Tech Stack (Locked Decisions)

| Layer | Technology | Version / Notes |
|---|---|---|
| **Monorepo root** | `d:\StartUP\recalix\` | Two subdirectories: `frontend/`, `backend/` |
| **Frontend** | Next.js (App Router) | v16.2.10, React 19, TypeScript 5, Tailwind CSS 4 |
| **Backend** | Node.js + Express.js | Standalone service (separate from Next.js), TypeScript |
| **Application DB** | MongoDB | Mongoose ODM, document-shaped data |
| **Knowledge Graph** | Neo4j | Core differentiator — Cypher queries, `neo4j-driver` npm package |
| **Code Parsing** | AST parsers per language | `ts-morph` (TS/JS), Python `ast` (later) |
| **Auth** | NextAuth.js (Auth.js v5) | JWT strategy, GitHub OAuth provider initially |
| **Job Queue** | BullMQ + Redis | Async ingestion jobs, incremental sync |
| **Containerization** | Docker + Docker Compose | Every service containerized from day one |
| **Package Manager** | npm | Workspaces not used — separate `package.json` per folder |

---

## 3. Repository Structure

```
recalix/
├── project_context.md              # Product context (existing)
├── technical_implementation.md     # This file
│
├── frontend/                       # Next.js App Router (existing scaffold)
│   ├── app/
│   │   ├── layout.tsx              # Root layout (sidebar + topbar shell)
│   │   ├── page.tsx                # Landing / redirect to dashboard
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                 # Auth route group (no layout nesting)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard shell (sidebar, topbar)
│   │   │   ├── page.tsx            # Overview: ingestion stats, recent queries
│   │   │   │
│   │   │   ├── query/
│   │   │   │   └── page.tsx        # Natural-language query interface
│   │   │   │
│   │   │   ├── graph/
│   │   │   │   └── page.tsx        # Interactive graph explorer (vis.js / d3)
│   │   │   │
│   │   │   ├── repos/
│   │   │   │   ├── page.tsx        # List connected repos
│   │   │   │   └── [repoId]/
│   │   │   │       └── page.tsx    # Single repo detail + ingestion status
│   │   │   │
│   │   │   ├── integrations/
│   │   │   │   └── page.tsx        # Connect GitHub / Jira / Slack
│   │   │   │
│   │   │   ├── ingestion/
│   │   │   │   └── page.tsx        # Ingestion run history + trigger manual sync
│   │   │   │
│   │   │   └── settings/
│   │   │       └── page.tsx        # Org settings, API keys, user management
│   │   │
│   │   └── api/                    # Thin Next.js API routes (auth callbacks only)
│   │       └── auth/
│   │           └── [...nextauth]/route.ts
│   │
│   ├── components/                 # Shared UI components
│   │   ├── ui/                     # Primitives (Button, Input, Card, Modal, etc.)
│   │   ├── layout/                 # Sidebar, Topbar, PageShell
│   │   ├── query/                  # QueryInput, QueryResult, SourceCard
│   │   ├── graph/                  # GraphCanvas, NodeTooltip, FilterPanel
│   │   └── integrations/           # IntegrationCard, OAuthButton
│   │
│   ├── lib/                        # Utilities
│   │   ├── api.ts                  # Axios/fetch wrapper for backend calls
│   │   ├── auth.ts                 # NextAuth config
│   │   └── utils.ts                # Shared helpers
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useQuery.ts             # Query submission + streaming
│   │   └── useGraph.ts             # Graph data fetching + state
│   │
│   ├── types/                      # Shared TypeScript types
│   │   └── index.ts
│   │
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                        # Express.js API server
│   ├── src/
│   │   ├── index.ts                # Express app entry point
│   │   ├── config/
│   │   │   ├── env.ts              # Environment variable validation (dotenv + zod)
│   │   │   ├── db.ts               # MongoDB connection (Mongoose)
│   │   │   └── neo4j.ts            # Neo4j driver connection
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT verification middleware
│   │   │   ├── errorHandler.ts     # Global error handler
│   │   │   └── rateLimiter.ts      # Rate limiting
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts            # Route aggregator
│   │   │   ├── auth.routes.ts
│   │   │   ├── repos.routes.ts
│   │   │   ├── integrations.routes.ts
│   │   │   ├── ingestion.routes.ts
│   │   │   ├── query.routes.ts
│   │   │   └── graph.routes.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── repos.controller.ts
│   │   │   ├── integrations.controller.ts
│   │   │   ├── ingestion.controller.ts
│   │   │   ├── query.controller.ts
│   │   │   └── graph.controller.ts
│   │   │
│   │   ├── services/
│   │   │   ├── github.service.ts        # GitHub API client (Octokit)
│   │   │   ├── jira.service.ts          # Jira REST API client
│   │   │   ├── slack.service.ts         # Slack Web API client
│   │   │   ├── ast-parser.service.ts    # AST parsing orchestrator
│   │   │   ├── neo4j.service.ts         # Cypher query builder + executor
│   │   │   ├── query.service.ts         # NL query → Cypher translation
│   │   │   └── encryption.service.ts    # AES-256-GCM for credential encryption
│   │   │
│   │   ├── models/                 # Mongoose schemas
│   │   │   ├── Organization.ts
│   │   │   ├── User.ts
│   │   │   ├── Integration.ts
│   │   │   ├── IngestionRun.ts
│   │   │   └── QueryLog.ts
│   │   │
│   │   ├── jobs/                   # BullMQ job processors
│   │   │   ├── queue.ts            # Queue setup + connection
│   │   │   ├── github-ingest.job.ts
│   │   │   ├── jira-ingest.job.ts
│   │   │   └── slack-ingest.job.ts
│   │   │
│   │   ├── parsers/                # Language-specific AST parsers
│   │   │   ├── typescript.parser.ts
│   │   │   └── python.parser.ts    # Phase 2+
│   │   │
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docker-compose.yml              # MongoDB, Neo4j, Redis, backend, frontend
├── .gitignore
└── README.md
```

---

## 4. Features Breakdown

### Phase 1 — Core Graph (MVP — prove "why does this exist" works)

| # | Feature | Description | Frontend | Backend |
|---|---|---|---|---|
| 1.1 | **AST Parser** | Parse a single repo's TS/JS files into `CodeEntity` nodes with relationships | — | `parsers/typescript.parser.ts` |
| 1.2 | **Neo4j Loader** | Write parsed AST nodes + edges into Neo4j | — | `neo4j.service.ts` |
| 1.3 | **GitHub Commit Ingestion** | Clone/pull repo, extract commits + diffs, create `Commit` nodes + `MODIFIES` edges | — | `github.service.ts`, `github-ingest.job.ts` |
| 1.4 | **Manual Ingestion Trigger** | UI button to trigger ingestion for a connected repo | Ingestion page | `POST /api/ingestion/trigger` |
| 1.5 | **Query Interface** | Natural-language input → Cypher query → graph-sourced answer with links | Query page | `POST /api/query` |
| 1.6 | **Graph Explorer** | Interactive visualization of code entities + their connections | Graph page | `GET /api/graph/explore` |

### Phase 2 — Integrations & History

| # | Feature | Description |
|---|---|---|
| 2.1 | **GitHub OAuth Integration** | Connect GitHub account, select repos to ingest |
| 2.2 | **Incremental Sync** | Cron-driven rolling sync (new commits since last cursor) |
| 2.3 | **Jira Ingestion** | Pull tickets, link to commits via branch names / commit messages |
| 2.4 | **Ingestion Dashboard** | Show run history, status, errors, last sync time per source |
| 2.5 | **Query History** | Log + display past queries with their graph answers |

### Phase 3 — Auth, Multi-tenant, Slack

| # | Feature | Description |
|---|---|---|
| 3.1 | **Auth (Login/Signup)** | NextAuth.js with GitHub OAuth + email/password |
| 3.2 | **Organization & RBAC** | Org creation, user roles (Admin, Member, Viewer) |
| 3.3 | **Slack Ingestion** | Pull threads, confidence-scored matching to code entities |
| 3.4 | **Settings Page** | Org settings, API key management, user invites |

### Phase 4 — Enterprise & Deployment

| # | Feature | Description |
|---|---|---|
| 4.1 | **Docker Compose Production** | Full stack in containers, env-based config |
| 4.2 | **DPDP Compliance** | Encryption-at-rest audit, data residency docs, consent flows |
| 4.3 | **On-Prem/BYOC Packaging** | Helm chart or Docker Compose bundle for customer infra |
| 4.4 | **Audit Logs** | Immutable log of all data access, queries, and admin actions |

---

## 5. Frontend Routes

| Route | Page | Description | Auth Required |
|---|---|---|---|
| `/` | Landing | Marketing / redirect to `/dashboard` if logged in | No |
| `/login` | Login | GitHub OAuth + credentials login | No |
| `/signup` | Signup | Create account | No |
| `/dashboard` | Dashboard Home | Overview stats: repos connected, entities indexed, recent queries, ingestion health | Yes |
| `/dashboard/query` | Query Interface | Natural-language search bar, results with source cards, graph snippet | Yes |
| `/dashboard/graph` | Graph Explorer | Full interactive graph visualization with filters (by entity type, time range, source) | Yes |
| `/dashboard/repos` | Repos List | All connected repos with ingestion status badges | Yes |
| `/dashboard/repos/[repoId]` | Repo Detail | Single repo: file tree, entity count, commit timeline, ingestion log | Yes |
| `/dashboard/integrations` | Integrations | Connect/disconnect GitHub, Jira, Slack with OAuth cards | Yes |
| `/dashboard/ingestion` | Ingestion History | Table of all ingestion runs: status, duration, entities processed, errors | Yes |
| `/dashboard/settings` | Settings | Org settings, API keys, user management, DPDP preferences | Yes (Admin) |

---

## 6. Backend API Endpoints

Base URL: `http://localhost:5000/api`

### 6.1 Authentication

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/auth/register` | Create user + org | `{ email, password, orgName }` | `{ user, token }` |
| `POST` | `/auth/login` | Email/password login | `{ email, password }` | `{ user, token }` |
| `POST` | `/auth/github` | Exchange GitHub OAuth code for JWT | `{ code }` | `{ user, token }` |
| `GET` | `/auth/me` | Get current user from JWT | — | `{ user }` |
| `POST` | `/auth/logout` | Invalidate token (if using blocklist) | — | `{ success }` |

### 6.2 Repositories

| Method | Endpoint | Description | Request Body / Params | Response |
|---|---|---|---|---|
| `GET` | `/repos` | List repos for current org | Query: `?status=active` | `{ repos[] }` |
| `POST` | `/repos` | Add a repo to track | `{ repoUrl, branch, name }` | `{ repo }` |
| `GET` | `/repos/:repoId` | Get repo detail + ingestion stats | — | `{ repo, stats }` |
| `DELETE` | `/repos/:repoId` | Remove repo + purge graph data | — | `{ success }` |
| `GET` | `/repos/:repoId/entities` | List code entities for a repo | Query: `?type=function&page=1` | `{ entities[], total }` |
| `GET` | `/repos/:repoId/commits` | List ingested commits | Query: `?since=ISO&page=1` | `{ commits[], total }` |

### 6.3 Integrations

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/integrations` | List all integrations for current org | — | `{ integrations[] }` |
| `POST` | `/integrations/github` | Connect GitHub (store encrypted token) | `{ accessToken }` | `{ integration }` |
| `POST` | `/integrations/jira` | Connect Jira | `{ baseUrl, email, apiToken }` | `{ integration }` |
| `POST` | `/integrations/slack` | Connect Slack | `{ botToken, signingSecret }` | `{ integration }` |
| `DELETE` | `/integrations/:integrationId` | Disconnect + wipe stored credentials | — | `{ success }` |
| `GET` | `/integrations/:integrationId/test` | Test connection health | — | `{ healthy, message }` |

### 6.4 Ingestion

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/ingestion/trigger` | Start manual ingestion for a repo | `{ repoId, sources: ["github"] }` | `{ jobId, status }` |
| `GET` | `/ingestion/runs` | List ingestion runs for org | Query: `?repoId=&status=&page=1` | `{ runs[], total }` |
| `GET` | `/ingestion/runs/:runId` | Get single run detail | — | `{ run }` |
| `POST` | `/ingestion/runs/:runId/cancel` | Cancel a running ingestion job | — | `{ success }` |
| `GET` | `/ingestion/status/:repoId` | Get real-time ingestion status for a repo | — | `{ status, progress, lastSync }` |

### 6.5 Query

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/query` | Submit natural-language query | `{ question, repoId?, filters? }` | `{ answer, sources[], graphSnippet }` |
| `GET` | `/query/history` | Get past queries for current user | Query: `?page=1&limit=20` | `{ queries[], total }` |
| `GET` | `/query/:queryId` | Get specific query result | — | `{ query, answer, sources[] }` |
| `POST` | `/query/cypher` | Execute raw Cypher (admin/debug only) | `{ cypher, params }` | `{ records[] }` |

### 6.6 Graph Explorer

| Method | Endpoint | Description | Request Body / Params | Response |
|---|---|---|---|---|
| `GET` | `/graph/explore` | Get subgraph around an entity | Query: `?entityId=&depth=2&limit=50` | `{ nodes[], edges[] }` |
| `GET` | `/graph/search` | Search graph nodes by name/path | Query: `?q=functionName&type=CodeEntity` | `{ results[] }` |
| `GET` | `/graph/entity/:entityId` | Get full detail for a graph node | — | `{ entity, relationships[] }` |
| `GET` | `/graph/entity/:entityId/history` | Get commit/change history for entity | — | `{ commits[], tickets[] }` |
| `GET` | `/graph/stats` | Graph-level statistics | — | `{ nodeCount, edgeCount, byType }` |

### 6.7 Organizations & Settings (Phase 3+)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/org` | Get current org details |
| `PATCH` | `/org` | Update org settings |
| `GET` | `/org/members` | List org members |
| `POST` | `/org/members/invite` | Invite user by email |
| `PATCH` | `/org/members/:userId/role` | Change member role |
| `DELETE` | `/org/members/:userId` | Remove member |

---

## 7. Data Models

### 7.1 MongoDB Schemas (Mongoose)

#### Organization
```typescript
{
  _id: ObjectId,
  name: string,                         // "Acme Corp"
  slug: string,                         // "acme-corp" (unique)
  tier: "starter" | "growth" | "enterprise",
  dpdpCompliance: {
    dataResidency: string,              // "IN" | "US" | etc.
    consentTimestamp: Date | null,
    encryptionVerified: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### User
```typescript
{
  _id: ObjectId,
  email: string,                        // unique
  passwordHash: string | null,          // null if OAuth-only
  name: string,
  avatarUrl: string | null,
  orgId: ObjectId,                      // ref: Organization
  role: "admin" | "member" | "viewer",
  githubId: string | null,             // for OAuth linking
  lastLoginAt: Date,
  createdAt: Date
}
```

#### Integration
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,                      // ref: Organization
  type: "github" | "jira" | "slack",
  credentials: {
    encryptedPayload: string,           // AES-256-GCM encrypted JSON
    iv: string,                         // initialization vector
    authTag: string                     // authentication tag
  },
  status: "active" | "revoked" | "error",
  lastTestedAt: Date | null,
  metadata: {                           // type-specific
    // GitHub: { installationId, login }
    // Jira: { baseUrl, projectKeys }
    // Slack: { teamId, teamName }
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### IngestionRun
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  repoId: ObjectId,
  source: "github" | "jira" | "slack",
  status: "queued" | "running" | "completed" | "failed" | "cancelled",
  triggeredBy: "manual" | "cron",
  cursor: {                             // for incremental sync
    lastCommitSha: string | null,
    lastTicketUpdated: Date | null,
    lastMessageTs: string | null
  },
  stats: {
    entitiesCreated: number,
    entitiesUpdated: number,
    edgesCreated: number,
    commitsProcessed: number,
    errorsCount: number
  },
  errorLog: string | null,
  startedAt: Date | null,
  completedAt: Date | null,
  createdAt: Date
}
```

#### QueryLog
```typescript
{
  _id: ObjectId,
  orgId: ObjectId,
  userId: ObjectId,
  question: string,                     // raw NL input
  generatedCypher: string | null,       // the Cypher query produced
  answer: string,                       // formatted response
  sourceNodeIds: string[],              // Neo4j node IDs returned
  repoId: ObjectId | null,
  latencyMs: number,
  createdAt: Date
}
```

### 7.2 Neo4j Graph Schema

#### Node Labels & Properties

```
(:CodeEntity {
  id: STRING,                           // unique UUID
  orgId: STRING,
  repoId: STRING,
  path: STRING,                         // "src/services/auth.ts"
  name: STRING,                         // "validateToken"
  type: STRING,                         // "function" | "class" | "file" | "module"
  language: STRING,                     // "typescript" | "python"
  signature: STRING | NULL,             // "validateToken(token: string): boolean"
  startLine: INTEGER,
  endLine: INTEGER,
  lastModifiedCommit: STRING,
  createdAt: DATETIME
})

(:Commit {
  id: STRING,                           // commit SHA
  orgId: STRING,
  repoId: STRING,
  message: STRING,
  author: STRING,
  authorEmail: STRING,
  timestamp: DATETIME,
  filesChanged: INTEGER,
  insertions: INTEGER,
  deletions: INTEGER
})

(:Ticket {
  id: STRING,                           // "PROJ-123"
  orgId: STRING,
  title: STRING,
  description: STRING,
  status: STRING,                       // "Done", "In Progress"
  assignee: STRING | NULL,
  priority: STRING | NULL,
  createdAt: DATETIME,
  updatedAt: DATETIME
})

(:Discussion {
  id: STRING,                           // Slack thread_ts or message ID
  orgId: STRING,
  channel: STRING,
  content: STRING,                      // message text
  author: STRING,
  participants: [STRING],
  timestamp: DATETIME
})
```

#### Relationship Types

```cypher
// Core relationships
(commit:Commit)-[:MODIFIES {linesAdded: INT, linesRemoved: INT, diff: STRING}]->(entity:CodeEntity)
(commit:Commit)-[:REFERENCES]->(ticket:Ticket)
(discussion:Discussion)-[:DISCUSSES]->(entity:CodeEntity | ticket:Ticket | commit:Commit)
(entity:CodeEntity)-[:DEPENDS_ON {type: "import" | "call" | "extends"}]->(entity:CodeEntity)

// Structural relationships (from AST)
(parent:CodeEntity)-[:CONTAINS]->(child:CodeEntity)   // file contains functions
(entity:CodeEntity)-[:EXPORTS]->(entity:CodeEntity)    // module exports

// PR relationships (Phase 2)
(pr:PullRequest)-[:INCLUDES]->(commit:Commit)
(pr:PullRequest)-[:REVIEWS]->(entity:CodeEntity)
```

#### Indexes (create on Neo4j init)

```cypher
CREATE INDEX code_entity_repo FOR (n:CodeEntity) ON (n.repoId);
CREATE INDEX code_entity_path FOR (n:CodeEntity) ON (n.path);
CREATE INDEX commit_repo FOR (n:Commit) ON (n.repoId);
CREATE INDEX commit_sha FOR (n:Commit) ON (n.id);
CREATE INDEX ticket_id FOR (n:Ticket) ON (n.id);
CREATE FULLTEXT INDEX entity_search FOR (n:CodeEntity) ON EACH [n.name, n.path, n.signature];
```

---

## 8. Key Architectural Decisions

### 8.1 Backend: Standalone Express (not Next.js API routes)

**Decision:** Use a standalone Express.js server in `backend/`.

**Rationale:**
- Ingestion jobs are long-running, CPU-heavy (AST parsing, Git cloning) — they don't belong in a serverless/edge function model
- BullMQ workers need a persistent Node.js process
- Neo4j driver maintains a connection pool — better managed in a long-lived server
- Clean separation: frontend is a pure UI consumer, backend owns all data logic
- On-prem deployment is simpler with two discrete services

### 8.2 Credential Encryption

**Non-negotiable** given DPDP compliance positioning. All third-party tokens (GitHub, Jira, Slack) must be encrypted at rest using AES-256-GCM with a server-side key (from env var `ENCRYPTION_KEY`). Never store plaintext tokens, even in dev.

```typescript
// encryption.service.ts pattern
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function encrypt(plaintext: string, key: Buffer): EncryptedPayload { ... }
function decrypt(payload: EncryptedPayload, key: Buffer): string { ... }
```

### 8.3 Query Pipeline (NL → Cypher → Answer)

```
User types question
       │
       ▼
  ┌─────────────┐
  │ query.service│  1. Parse intent from NL question
  │              │  2. Map to Cypher template or generate Cypher
  │              │  3. Execute against Neo4j
  │              │  4. Format results with source links
  └──────┬──────┘
         │
         ▼
  Return { answer, sources[], graphSnippet }
```

**Phase 1 approach:** Template-based Cypher generation (pattern matching on question types like "why does X exist", "who last changed X", "what tickets relate to X").

**Phase 2+ approach:** LLM-assisted Cypher generation (feed schema + question to an LLM, validate output Cypher before executing).

### 8.4 Incremental Ingestion

Every ingestion run stores a **cursor** (last commit SHA, last Jira update timestamp, last Slack message timestamp). Next run picks up from cursor. Schema and job structure assume continuous sync from day one, even though Phase 1 only supports manual triggers.

---

## 9. Environment Variables

```env
# Backend (.env)
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/recalix

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>

# Redis (BullMQ)
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=<random-256-bit-key>
JWT_EXPIRY=7d

# Encryption (DPDP compliance)
ENCRYPTION_KEY=<64-hex-char-key>    # 32 bytes hex-encoded

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/callback/github

# Jira (Phase 2)
# JIRA_* — per-org, stored encrypted in DB, not in env

# Slack (Phase 3)
# SLACK_* — per-org, stored encrypted in DB, not in env

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>
```

---

## 10. Docker Compose (Development)

```yaml
version: "3.9"
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo_data:/data/db"]

  neo4j:
    image: neo4j:5
    ports: ["7474:7474", "7687:7687"]
    environment:
      NEO4J_AUTH: neo4j/recalix_dev
      NEO4J_PLUGINS: '["apoc"]'
    volumes: ["neo4j_data:/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  backend:
    build: ./backend
    ports: ["5000:5000"]
    depends_on: [mongodb, neo4j, redis]
    env_file: ./backend/.env
    volumes: ["./backend/src:/app/src"]   # hot reload

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
    env_file: ./frontend/.env.local

volumes:
  mongo_data:
  neo4j_data:
```

---

## 11. NPM Dependencies

### Backend (`backend/package.json`)

```json
{
  "dependencies": {
    "express": "^5",
    "cors": "^2",
    "helmet": "^8",
    "morgan": "^1",
    "dotenv": "^16",
    "zod": "^3",
    "mongoose": "^8",
    "neo4j-driver": "^5",
    "bullmq": "^5",
    "ioredis": "^5",
    "jsonwebtoken": "^9",
    "bcryptjs": "^3",
    "octokit": "^4",
    "ts-morph": "^24",
    "simple-git": "^3",
    "uuid": "^10"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsx": "^4",
    "nodemon": "^3",
    "@types/express": "^5",
    "@types/cors": "^2",
    "@types/jsonwebtoken": "^9",
    "@types/bcryptjs": "^2",
    "@types/node": "^22"
  }
}
```

### Frontend (already scaffolded — additions needed)

```
npm install axios @vis-network/standalone lucide-react clsx date-fns
npm install -D @types/node
```

---

## 12. Build & Run Commands

```bash
# Start infrastructure
docker-compose up -d mongodb neo4j redis

# Backend
cd backend
npm install
npm run dev                # tsx watch src/index.ts

# Frontend
cd frontend
npm install
npm run dev                # next dev (port 3000)
```

---

## 13. Build Order for Agents

> **CRITICAL:** Follow this exact order. Do not skip ahead to auth or UI polish before the graph works end-to-end.

### Step 1 — Backend Foundation
1. Initialize `backend/` with `package.json`, `tsconfig.json`, Express entry point
2. Set up config (env validation, MongoDB connection, Neo4j driver connection)
3. Implement error handler middleware
4. Verify: backend starts, connects to MongoDB and Neo4j, returns health check at `GET /api/health`

### Step 2 — AST Parser + Neo4j Loader
1. Build `typescript.parser.ts` — parse a directory of `.ts/.js` files into `CodeEntity` nodes with `DEPENDS_ON` and `CONTAINS` edges
2. Build `neo4j.service.ts` — batch-write nodes and edges to Neo4j
3. Verify: parse a real repo, inspect graph in Neo4j Browser at `http://localhost:7474`

### Step 3 — GitHub Ingestion
1. Build `github.service.ts` — clone repo via `simple-git`, iterate commits, extract diffs
2. Build `github-ingest.job.ts` — BullMQ job that runs the full pipeline: clone → parse AST → extract commits → write to Neo4j + log to MongoDB
3. Build `ingestion.controller.ts` + routes — expose `POST /api/ingestion/trigger` and `GET /api/ingestion/runs`
4. Verify: trigger ingestion for a test repo, see nodes + edges in Neo4j

### Step 4 — Query Engine
1. Build `query.service.ts` — template-based NL → Cypher mapping
2. Build `query.controller.ts` + routes — expose `POST /api/query`
3. Build `graph.controller.ts` + routes — expose graph exploration endpoints
4. Verify: ask "why does function X exist" and get a traceable answer

### Step 5 — Frontend Dashboard
1. Build layout shell (sidebar, topbar)
2. Build Dashboard home page (stats from `GET /api/graph/stats` and `GET /api/ingestion/runs`)
3. Build Query page (input → `POST /api/query` → render results with source cards)
4. Build Graph Explorer page (fetch subgraph → render with vis.js)
5. Build Repos page (list + detail)
6. Build Ingestion page (run history + trigger button)

### Step 6 — Integrations UI
1. Build Integrations page (OAuth cards for GitHub, Jira placeholder, Slack placeholder)
2. Wire up GitHub OAuth flow end-to-end

### Step 7 — Auth (Phase 3)
1. Add NextAuth.js to frontend
2. Build auth endpoints in backend
3. Add JWT middleware to protect all routes
4. Build login/signup pages

### Step 8 — Jira + Slack Ingestion (Phase 3)
1. Build `jira.service.ts` + `jira-ingest.job.ts`
2. Build `slack.service.ts` + `slack-ingest.job.ts` (with confidence-scored entity matching)

### Step 9 — Enterprise Polish (Phase 4)
1. Settings page, RBAC enforcement
2. Docker Compose production config
3. Audit logs
4. DPDP compliance docs

---

## 14. Testing Strategy

| Layer | Tool | What to Test |
|---|---|---|
| Backend unit | Jest + ts-jest | Services (parser, encryption, query template matching) |
| Backend integration | Jest + Supertest | API endpoints against test MongoDB + Neo4j |
| Frontend unit | Jest + React Testing Library | Component rendering, hook behavior |
| Frontend E2E | Playwright | Full flows: login → query → view graph |
| Neo4j | Cypher assertions in Jest | Graph integrity after ingestion |

---

## 15. Open Decisions (Flagged for Human)

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | LLM for query → Cypher | OpenAI API / Google Gemini / local Ollama | Start with templates (no LLM dependency), add LLM in Phase 2 |
| 2 | Graph visualization library | vis.js / d3-force / Cytoscape.js | vis.js (easiest to get started, good enough for MVP) |
| 3 | Vector store for semantic search | Neo4j vector index / pgvector / FAISS | Defer — not needed for Phase 1 |
| 4 | Multi-language AST support | ts-morph only vs. tree-sitter (universal) | Start with ts-morph for TS/JS, evaluate tree-sitter for multi-lang in Phase 2 |
| 5 | Hosting for dev/demo | Vercel (frontend) + Railway/Render (backend) / single VPS | Single VPS with Docker Compose is simpler and matches on-prem story |

---

*Last updated: 2026-07-13*
