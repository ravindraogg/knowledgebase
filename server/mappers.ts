// Convert snake_case Postgres rows into the camelCase DTOs the frontend expects
// (shapes mirror lib/types.ts).

export function mapOrg(r: any) {
  return {
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    deploymentMode: r.deployment_mode,
  }
}

export function mapUser(r: any) {
  return {
    id: r.user_id ?? r.id,
    email: r.email,
    name: r.name,
    avatarUrl: r.avatar_url ?? null,
  }
}

export function mapMember(r: any) {
  return {
    id: r.id,
    orgId: r.org_id,
    role: r.role,
    joinedAt: r.joined_at,
    lastActive: r.last_active,
    user: {
      id: r.user_id,
      email: r.email,
      name: r.name,
      avatarUrl: r.avatar_url ?? null,
    },
  }
}

export function mapConnector(r: any) {
  return {
    id: r.id,
    orgId: r.org_id,
    type: r.type,
    status: r.status,
    lastSyncedAt: r.last_synced_at,
    scopeConfig: r.scope_config ?? { summary: "", scopes: [], details: [] },
  }
}

export function mapNode(r: any) {
  return {
    id: r.id,
    orgId: r.org_id,
    type: r.type,
    label: r.label,
    metadata: Array.isArray(r.metadata) ? r.metadata : [],
  }
}

export function mapEdge(r: any) {
  return {
    id: r.id,
    orgId: r.org_id,
    source: r.source_id,
    target: r.target_id,
    relationshipType: r.relationship_type,
    label: r.relationship_type,
  }
}

export function mapRisk(r: any) {
  return {
    id: r.id,
    moduleName: r.module_name,
    busFactor: r.bus_factor,
    primaryOwner: r.primary_owner,
    knowledgeConcentration: r.knowledge_concentration,
    lastUpdated: r.last_updated,
    contributors: Array.isArray(r.contributors) ? r.contributors : [],
  }
}

export function mapMessage(r: any) {
  return {
    id: r.id,
    role: r.role,
    content: r.content,
    citations: r.citations ?? undefined,
    decisionTrail: r.decision_trail ?? undefined,
    createdAt: r.created_at,
  }
}

export function mapSession(r: any, messages: any[] = []) {
  return {
    id: r.id,
    orgId: r.org_id,
    userId: r.user_id,
    title: r.title,
    createdAt: r.created_at,
    messages: messages.map(mapMessage),
  }
}
