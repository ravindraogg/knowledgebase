import { useAuth } from '@/components/AuthProvider';

const ROLE_LEVEL: Record<string, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
  super_admin: 5,
};

export interface Permissions {
  canQuery: boolean;
  canExploreGraph: boolean;
  canSearchGraph: boolean;
  canTriggerIngestion: boolean;
  canCancelIngestion: boolean;
  canViewErrorLogs: boolean;
  canManageRepos: boolean;
  canManageIntegrations: boolean;
  canManageUsers: boolean;
  canInviteAdmin: boolean;
  canAccessSettings: boolean;
  canManageBilling: boolean;
  canManageCompliance: boolean;
  canManageApiKeys: boolean;
  canViewAuditLogs: boolean;
  canDeleteOrg: boolean;
  canExecuteRawCypher: boolean;
  canViewAllQueryHistory: boolean;
}

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const level = ROLE_LEVEL[user?.role || ''] || 0;

  return {
    canQuery:                level >= 2,
    canExploreGraph:         level >= 1,
    canSearchGraph:          level >= 2,
    canTriggerIngestion:     level >= 2,
    canCancelIngestion:      level >= 3,
    canViewErrorLogs:        level >= 3,
    canManageRepos:          level >= 3,
    canManageIntegrations:   level >= 3,
    canManageUsers:          level >= 3,
    canInviteAdmin:          level >= 4,
    canAccessSettings:       level >= 3,
    canManageBilling:        level >= 4,
    canManageCompliance:     level >= 4,
    canManageApiKeys:        level >= 4,
    canViewAuditLogs:        level >= 4,
    canDeleteOrg:            level >= 4,
    canExecuteRawCypher:     level >= 3,
    canViewAllQueryHistory:  level >= 3,
  };
}
