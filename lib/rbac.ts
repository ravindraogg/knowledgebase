import type { Role } from './types'

// Central permission map. Middleware and UI both read from here so access
// control stays consistent as features grow.
export type Permission =
  | 'chat'
  | 'graph'
  | 'dashboard'
  | 'integrations'
  | 'settings'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['chat', 'graph', 'dashboard', 'integrations', 'settings'],
  engineer: ['chat', 'graph'],
  viewer: ['graph', 'dashboard'],
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  engineer: 'Engineer',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Manage integrations, invite users, and see the full risk dashboard.',
  engineer: 'Query the chatbot and explore the knowledge graph.',
  viewer: 'Read-only access to dashboards.',
}
