// Seed data for the demo organization. In production these rows live in
// Postgres (Supabase). This module is the single source of truth for the mock
// shell so the UI feels fully populated and clickable end-to-end.

import type {
  Connector,
  GraphData,
  ModuleRisk,
  Organization,
  OrganizationMember,
  User,
} from './types'

export const DEMO_ORG: Organization = {
  id: 'org_acme',
  name: 'Acme Payments',
  createdAt: '2023-04-12T10:00:00Z',
  deploymentMode: 'cloud',
}

export const DEMO_USERS: User[] = [
  { id: 'u_sarah', email: 'sarah.chen@acme.dev', name: 'Sarah Chen', avatarUrl: null },
  { id: 'u_marcus', email: 'marcus.li@acme.dev', name: 'Marcus Li', avatarUrl: null },
  { id: 'u_priya', email: 'priya.nair@acme.dev', name: 'Priya Nair', avatarUrl: null },
  { id: 'u_diego', email: 'diego.ramos@acme.dev', name: 'Diego Ramos', avatarUrl: null },
  { id: 'u_aiko', email: 'aiko.tanaka@acme.dev', name: 'Aiko Tanaka', avatarUrl: null },
  { id: 'u_jordan', email: 'jordan.webb@acme.dev', name: 'Jordan Webb', avatarUrl: null },
]

export const DEMO_MEMBERS: OrganizationMember[] = [
  { id: 'm1', orgId: DEMO_ORG.id, user: DEMO_USERS[0], role: 'admin', joinedAt: '2023-04-12T10:00:00Z', lastActive: '2026-06-24T08:10:00Z' },
  { id: 'm2', orgId: DEMO_ORG.id, user: DEMO_USERS[1], role: 'engineer', joinedAt: '2023-05-02T10:00:00Z', lastActive: '2026-06-23T17:42:00Z' },
  { id: 'm3', orgId: DEMO_ORG.id, user: DEMO_USERS[2], role: 'engineer', joinedAt: '2023-06-18T10:00:00Z', lastActive: '2026-06-24T07:55:00Z' },
  { id: 'm4', orgId: DEMO_ORG.id, user: DEMO_USERS[3], role: 'engineer', joinedAt: '2024-01-09T10:00:00Z', lastActive: '2026-06-22T13:20:00Z' },
  { id: 'm5', orgId: DEMO_ORG.id, user: DEMO_USERS[4], role: 'viewer', joinedAt: '2024-03-21T10:00:00Z', lastActive: '2026-06-24T06:30:00Z' },
  { id: 'm6', orgId: DEMO_ORG.id, user: DEMO_USERS[5], role: 'viewer', joinedAt: '2024-08-14T10:00:00Z', lastActive: '2026-06-20T11:05:00Z' },
]

export const DEMO_CONNECTORS: Connector[] = [
  {
    id: 'c_github',
    orgId: DEMO_ORG.id,
    type: 'github',
    status: 'connected',
    lastSyncedAt: '2026-06-24T06:00:00Z',
    scopeConfig: {
      summary: 'Repositories: 12 connected',
      scopes: ['Read: Pull Requests', 'Read: Commits', 'Read: Code Reviews'],
      details: [
        { label: 'Repositories', value: '12 connected' },
        { label: 'Organization', value: 'acme-eng' },
        { label: 'Access', value: 'Read-only' },
      ],
    },
  },
  {
    id: 'c_jira',
    orgId: DEMO_ORG.id,
    type: 'jira',
    status: 'connected',
    lastSyncedAt: '2026-06-24T05:30:00Z',
    scopeConfig: {
      summary: 'Projects: 4 connected',
      scopes: ['Read: Issues', 'Read: Comments'],
      details: [
        { label: 'Projects', value: 'PAY, AUTH, PLAT, INFRA' },
        { label: 'Site', value: 'acme.atlassian.net' },
        { label: 'Access', value: 'Read-only' },
      ],
    },
  },
  {
    id: 'c_slack',
    orgId: DEMO_ORG.id,
    type: 'slack',
    status: 'disconnected',
    lastSyncedAt: null,
    scopeConfig: {
      summary: 'Not connected',
      scopes: ['Read: Public channel messages (excludes DMs and private channels by default)'],
      details: [
        { label: 'Workspace', value: 'Not connected' },
        { label: 'Channels', value: '—' },
        { label: 'Access', value: 'Read-only' },
      ],
    },
  },
]

// ~18-node knowledge graph spanning Payments + Authentication ecosystems.
export const DEMO_GRAPH: GraphData = {
  nodes: [
    // People
    { id: 'p_sarah', orgId: DEMO_ORG.id, type: 'person', label: 'Sarah Chen', metadata: [{ label: 'Role', value: 'Staff Engineer' }, { label: 'Knowledge concentration', value: '68% of auth module' }, { label: 'Tenure', value: '3.2 years' }] },
    { id: 'p_marcus', orgId: DEMO_ORG.id, type: 'person', label: 'Marcus Li', metadata: [{ label: 'Role', value: 'Senior Engineer' }, { label: 'Knowledge concentration', value: '54% of payments module' }, { label: 'Tenure', value: '3.0 years' }] },
    { id: 'p_priya', orgId: DEMO_ORG.id, type: 'person', label: 'Priya Nair', metadata: [{ label: 'Role', value: 'Engineer' }, { label: 'Knowledge concentration', value: '22% of payments module' }, { label: 'Tenure', value: '2.0 years' }] },
    { id: 'p_diego', orgId: DEMO_ORG.id, type: 'person', label: 'Diego Ramos', metadata: [{ label: 'Role', value: 'Engineer' }, { label: 'Knowledge concentration', value: '18% of auth module' }, { label: 'Tenure', value: '1.4 years' }] },

    // Code
    { id: 'code_auth', orgId: DEMO_ORG.id, type: 'code', label: 'auth/session.ts', metadata: [{ label: 'Bus factor', value: '1' }, { label: 'Last modified', value: 'PR #892' }, { label: 'Owner', value: 'Sarah Chen' }] },
    { id: 'code_token', orgId: DEMO_ORG.id, type: 'code', label: 'auth/tokenRotation.ts', metadata: [{ label: 'Bus factor', value: '1' }, { label: 'Last modified', value: 'PR #864' }, { label: 'Owner', value: 'Sarah Chen' }] },
    { id: 'code_pay', orgId: DEMO_ORG.id, type: 'code', label: 'payments/processPayment()', metadata: [{ label: 'Bus factor', value: '2' }, { label: 'Last modified', value: 'PR #905' }, { label: 'Owner', value: 'Marcus Li' }] },
    { id: 'code_refund', orgId: DEMO_ORG.id, type: 'code', label: 'payments/refundEngine.ts', metadata: [{ label: 'Bus factor', value: '2' }, { label: 'Last modified', value: 'PR #871' }, { label: 'Owner', value: 'Marcus Li' }] },
    { id: 'code_webhook', orgId: DEMO_ORG.id, type: 'code', label: 'payments/webhooks.ts', metadata: [{ label: 'Bus factor', value: '3' }, { label: 'Last modified', value: 'PR #888' }, { label: 'Owner', value: 'Priya Nair' }] },

    // Decisions
    { id: 'd_892', orgId: DEMO_ORG.id, type: 'decision', label: 'PR #892', metadata: [{ label: 'Title', value: 'Migrate sessions to rotating JWT' }, { label: 'Merged', value: '2026-05-18' }, { label: 'Reviewers', value: 'Diego Ramos' }] },
    { id: 'd_905', orgId: DEMO_ORG.id, type: 'decision', label: 'PR #905', metadata: [{ label: 'Title', value: 'Idempotent payment processing' }, { label: 'Merged', value: '2026-06-02' }, { label: 'Reviewers', value: 'Priya Nair' }] },
    { id: 'd_adr12', orgId: DEMO_ORG.id, type: 'decision', label: 'ADR-12', metadata: [{ label: 'Title', value: 'Choose stateless auth strategy' }, { label: 'Status', value: 'Accepted' }, { label: 'Author', value: 'Sarah Chen' }] },
    { id: 'd_slack', orgId: DEMO_ORG.id, type: 'decision', label: 'Slack #payments', metadata: [{ label: 'Topic', value: 'Refund race condition' }, { label: 'Date', value: '2026-05-29' }, { label: 'Participants', value: 'Marcus, Priya' }] },

    // Work items
    { id: 'w_pay128', orgId: DEMO_ORG.id, type: 'work_item', label: 'PAY-128', metadata: [{ label: 'Title', value: 'Duplicate charge on retry' }, { label: 'Status', value: 'Done' }, { label: 'Assignee', value: 'Marcus Li' }] },
    { id: 'w_auth77', orgId: DEMO_ORG.id, type: 'work_item', label: 'AUTH-77', metadata: [{ label: 'Title', value: 'Session fixation hardening' }, { label: 'Status', value: 'Done' }, { label: 'Assignee', value: 'Sarah Chen' }] },
    { id: 'w_pay140', orgId: DEMO_ORG.id, type: 'work_item', label: 'PAY-140', metadata: [{ label: 'Title', value: 'Webhook signature verification' }, { label: 'Status', value: 'In Progress' }, { label: 'Assignee', value: 'Priya Nair' }] },
    { id: 'w_auth90', orgId: DEMO_ORG.id, type: 'work_item', label: 'AUTH-90', metadata: [{ label: 'Title', value: 'Token rotation rollout' }, { label: 'Status', value: 'Done' }, { label: 'Assignee', value: 'Sarah Chen' }] },
  ],
  edges: [
    { id: 'e1', orgId: DEMO_ORG.id, source: 'p_sarah', target: 'code_auth', relationshipType: 'AUTHORED', label: 'AUTHORED' },
    { id: 'e2', orgId: DEMO_ORG.id, source: 'p_sarah', target: 'code_token', relationshipType: 'AUTHORED', label: 'AUTHORED' },
    { id: 'e3', orgId: DEMO_ORG.id, source: 'p_marcus', target: 'code_pay', relationshipType: 'AUTHORED', label: 'AUTHORED' },
    { id: 'e4', orgId: DEMO_ORG.id, source: 'p_marcus', target: 'code_refund', relationshipType: 'AUTHORED', label: 'AUTHORED' },
    { id: 'e5', orgId: DEMO_ORG.id, source: 'p_priya', target: 'code_webhook', relationshipType: 'AUTHORED', label: 'AUTHORED' },
    { id: 'e6', orgId: DEMO_ORG.id, source: 'p_diego', target: 'd_892', relationshipType: 'REVIEWED', label: 'REVIEWED' },
    { id: 'e7', orgId: DEMO_ORG.id, source: 'p_priya', target: 'd_905', relationshipType: 'REVIEWED', label: 'REVIEWED' },
    { id: 'e8', orgId: DEMO_ORG.id, source: 'd_892', target: 'code_auth', relationshipType: 'MODIFIES', label: 'MODIFIES' },
    { id: 'e9', orgId: DEMO_ORG.id, source: 'd_905', target: 'code_pay', relationshipType: 'MODIFIES', label: 'MODIFIES' },
    { id: 'e10', orgId: DEMO_ORG.id, source: 'd_892', target: 'd_adr12', relationshipType: 'REFERENCES', label: 'REFERENCES' },
    { id: 'e11', orgId: DEMO_ORG.id, source: 'd_adr12', target: 'code_token', relationshipType: 'REFERENCES', label: 'REFERENCES' },
    { id: 'e12', orgId: DEMO_ORG.id, source: 'w_auth77', target: 'd_892', relationshipType: 'RESOLVED_BY', label: 'RESOLVED_BY' },
    { id: 'e13', orgId: DEMO_ORG.id, source: 'w_pay128', target: 'd_905', relationshipType: 'RESOLVED_BY', label: 'RESOLVED_BY' },
    { id: 'e14', orgId: DEMO_ORG.id, source: 'd_slack', target: 'code_refund', relationshipType: 'REFERENCES', label: 'REFERENCES' },
    { id: 'e15', orgId: DEMO_ORG.id, source: 'w_pay140', target: 'code_webhook', relationshipType: 'TRACKS', label: 'TRACKS' },
    { id: 'e16', orgId: DEMO_ORG.id, source: 'w_auth90', target: 'code_token', relationshipType: 'TRACKS', label: 'TRACKS' },
    { id: 'e17', orgId: DEMO_ORG.id, source: 'p_sarah', target: 'd_adr12', relationshipType: 'AUTHORED', label: 'AUTHORED' },
    { id: 'e18', orgId: DEMO_ORG.id, source: 'p_marcus', target: 'd_slack', relationshipType: 'PARTICIPATED', label: 'PARTICIPATED' },
    { id: 'e19', orgId: DEMO_ORG.id, source: 'p_priya', target: 'd_slack', relationshipType: 'PARTICIPATED', label: 'PARTICIPATED' },
    { id: 'e20', orgId: DEMO_ORG.id, source: 'p_diego', target: 'code_auth', relationshipType: 'REVIEWED', label: 'REVIEWED' },
  ],
}

export const DEMO_MODULE_RISK: ModuleRisk[] = [
  {
    id: 'mod_auth',
    moduleName: 'Authentication System',
    busFactor: 1,
    primaryOwner: 'Sarah Chen',
    knowledgeConcentration: 68,
    lastUpdated: '2026-05-18',
    contributors: [
      { name: 'Sarah Chen', concentration: 68 },
      { name: 'Diego Ramos', concentration: 18 },
      { name: 'Marcus Li', concentration: 9 },
      { name: 'Priya Nair', concentration: 5 },
    ],
  },
  {
    id: 'mod_payments',
    moduleName: 'Payments Core',
    busFactor: 2,
    primaryOwner: 'Marcus Li',
    knowledgeConcentration: 54,
    lastUpdated: '2026-06-02',
    contributors: [
      { name: 'Marcus Li', concentration: 54 },
      { name: 'Priya Nair', concentration: 28 },
      { name: 'Sarah Chen', concentration: 12 },
      { name: 'Diego Ramos', concentration: 6 },
    ],
  },
  {
    id: 'mod_webhooks',
    moduleName: 'Webhook Pipeline',
    busFactor: 3,
    primaryOwner: 'Priya Nair',
    knowledgeConcentration: 41,
    lastUpdated: '2026-06-12',
    contributors: [
      { name: 'Priya Nair', concentration: 41 },
      { name: 'Marcus Li', concentration: 33 },
      { name: 'Diego Ramos', concentration: 26 },
    ],
  },
  {
    id: 'mod_billing',
    moduleName: 'Billing & Invoicing',
    busFactor: 4,
    primaryOwner: 'Diego Ramos',
    knowledgeConcentration: 32,
    lastUpdated: '2026-06-20',
    contributors: [
      { name: 'Diego Ramos', concentration: 32 },
      { name: 'Priya Nair', concentration: 30 },
      { name: 'Marcus Li', concentration: 22 },
      { name: 'Sarah Chen', concentration: 16 },
    ],
  },
]
