// Shared domain types for Engineering Memory OS.
// These mirror the Postgres schema described in the project spec so that the
// mock layer and a future Supabase-backed implementation share the same shapes.

export type Role = 'admin' | 'engineer' | 'viewer'
export type DeploymentMode = 'cloud' | 'byoc'
export type ConnectorType = 'github' | 'jira' | 'slack'
export type ConnectorStatus = 'connected' | 'disconnected' | 'syncing' | 'error'
export type NodeType = 'person' | 'code' | 'decision' | 'work_item'
export type ChatRole = 'user' | 'assistant'

export interface Organization {
  id: string
  name: string
  createdAt: string
  deploymentMode: DeploymentMode
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export interface OrganizationMember {
  id: string
  orgId: string
  user: User
  role: Role
  joinedAt: string
  lastActive: string
}

export interface Connector {
  id: string
  orgId: string
  type: ConnectorType
  status: ConnectorStatus
  lastSyncedAt: string | null
  scopeConfig: {
    summary: string
    scopes: string[]
    details: { label: string; value: string }[]
  }
}

export interface Citation {
  id: string
  kind: 'pr' | 'slack' | 'function' | 'jira' | 'adr'
  label: string
  // Mock source artifact rendered in the side panel.
  source: {
    title: string
    meta: string
    body: string
    language?: string
  }
}

export interface DecisionTrailStep {
  id: string
  label: string
  type: NodeType | 'event'
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  citations?: Citation[]
  decisionTrail?: DecisionTrailStep[]
  createdAt: string
}

export interface ChatSession {
  id: string
  orgId: string
  userId: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

export interface GraphNode {
  id: string
  orgId: string
  type: NodeType
  label: string
  metadata: { label: string; value: string }[]
}

export interface GraphEdge {
  id: string
  orgId: string
  source: string
  target: string
  relationshipType: string
  label: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface ModuleRisk {
  id: string
  moduleName: string
  busFactor: number // 1-5
  primaryOwner: string
  knowledgeConcentration: number // percent
  lastUpdated: string
  contributors: { name: string; concentration: number }[]
}
