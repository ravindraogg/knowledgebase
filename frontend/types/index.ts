export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'owner' | 'admin' | 'member' | 'viewer';
  orgId: string;
  orgName: string;
  orgSlug: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  tier: 'starter' | 'growth' | 'enterprise';
  website?: string;
  industry?: string;
  companySize?: string;
  useCases?: string[];
  deploymentPreference?: string;
  expectedRepoCount?: string;
  dpdpCompliance?: {
    dataResidency: string;
    consentTimestamp: string | null;
    encryptionVerified: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Repository {
  _id: string;
  name: string;
  repoUrl: string;
  branch: string;
  status: 'active' | 'error' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Integration {
  _id: string;
  orgId: string;
  type: 'github' | 'jira' | 'slack';
  status: 'active' | 'revoked' | 'error';
  metadata?: Record<string, string>;
  lastTestedAt?: string;
  createdAt: string;
}

export interface IngestionRun {
  _id: string;
  repoId?: { _id: string; name: string; repoUrl: string };
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  stats?: {
    entitiesCreated: number;
    entitiesUpdated: number;
    edgesCreated: number;
    commitsProcessed: number;
    errorsCount: number;
  };
  errorLog?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface QueryLog {
  _id: string;
  question: string;
  generatedCypher?: string;
  answer: string;
  sourceNodeIds: string[];
  repoIds?: string[];
  latencyMs: number;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  path: string;
  signature?: string;
  language?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

export interface QueryResult {
  answer: string;
  sources: Source[];
  graphSnippet: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  latencyMs: number;
}

export interface Source {
  id: string;
  name: string;
  type: string;
  path: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  latencyMs?: number;
  timestamp: Date;
}

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
}

export interface AuditLogEntry {
  _id: string;
  orgId: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  details: Record<string, unknown>;
  ip: string;
  createdAt: string;
}
