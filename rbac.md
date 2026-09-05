# Recalix — RBAC, User Roles & Permissions

> **Purpose:** Defines the complete role-based access control hierarchy, permission matrix, and feature access for every user role in Recalix. This document governs authorization logic in both backend middleware and frontend UI gating.

---

## 1. Role Hierarchy

Recalix uses a strict hierarchical RBAC model. Higher roles inherit all permissions of lower roles. There is no lateral role — every role sits on a single vertical chain.

```
Super Admin (platform level)
    |
    +--- Owner (org level, one per org)
            |
            +--- Admin
                    |
                    +--- Member
                            |
                            +--- Viewer
```

| Level | Role | Scope | Count per Org | Created By |
|---|---|---|---|---|
| 5 | **Super Admin** | Platform-wide (all orgs) | System-defined | System |
| 4 | **Owner** | Single organization | Exactly 1 | Account creation |
| 3 | **Admin** | Single organization | Unlimited | Owner |
| 2 | **Member** | Single organization | Unlimited | Owner or Admin |
| 1 | **Viewer** | Single organization | Unlimited | Owner or Admin |

---

## 2. Role Definitions

### 2.1 Super Admin

**Scope:** Entire Recalix platform (all organizations).

**Purpose:** Platform operator role for Recalix's own team. Used for system maintenance, debugging, and support escalations. Never exposed to end customers.

**Key capabilities:**
- Access any organization's data (read-only by default, write with audit trail)
- View platform-wide analytics (total orgs, total queries, ingestion health across all tenants)
- Suspend or delete organizations
- Manage platform-level configuration (feature flags, rate limits, system announcements)
- Impersonate any user for debugging (with mandatory audit log entry)
- Access system health dashboards (MongoDB, Neo4j, Redis, BullMQ metrics)

**Restrictions:**
- Cannot modify customer credentials or tokens
- Cannot execute queries on behalf of a customer without impersonation (which is logged)
- Cannot disable audit logging

---

### 2.2 Owner

**Scope:** Single organization.

**Purpose:** The person who created the organization. Holds ultimate authority over the org. Cannot be removed or demoted except by a Super Admin. Every org has exactly one Owner.

**Key capabilities:**
- All Admin permissions (inherited)
- Transfer ownership to another user (irreversible self-demotion to Admin)
- Delete the organization (requires confirmation + re-authentication)
- Manage billing and subscription tier (Starter / Growth / Enterprise)
- Configure DPDP compliance settings (data residency, consent management)
- Generate and revoke org-level API keys
- View and export audit logs
- Manage all integrations (connect/disconnect GitHub, Jira, Slack)
- Promote any Member to Admin, or demote Admins to Member

---

### 2.3 Admin

**Scope:** Single organization.

**Purpose:** Trusted team lead or engineering manager. Can manage people, integrations, and ingestion — but cannot delete the org or change compliance/billing settings.

**Key capabilities:**
- All Member permissions (inherited)
- Invite new users (as Member or Viewer)
- Remove users (except Owner and other Admins)
- Change user roles (Member to Viewer, Viewer to Member)
- Connect and disconnect integrations (GitHub, Jira, Slack)
- Test integration connections
- Add and remove repositories from tracking
- Trigger and cancel ingestion runs
- Configure ingestion schedules (cron settings for incremental sync)
- View ingestion error logs
- Execute raw Cypher queries (debug/admin endpoint)
- View all users' query history (not just their own)
- Manage org settings (name, slug — not billing or compliance)

**Restrictions:**
- Cannot delete the organization
- Cannot change billing/subscription tier
- Cannot modify DPDP compliance settings
- Cannot promote to Admin (only Owner can)
- Cannot remove or demote other Admins
- Cannot generate org-level API keys

---

### 2.4 Member

**Scope:** Single organization.

**Purpose:** Standard engineer or contributor. Full access to the knowledge graph for querying and exploration. Can trigger ingestion but cannot manage people or integrations.

**Key capabilities:**
- All Viewer permissions (inherited)
- Submit natural-language queries
- View their own query history
- Explore the graph (navigate nodes, view relationships, expand neighborhoods)
- Search graph nodes by name, path, or type
- View entity detail pages (code entity, commit, ticket, discussion)
- View entity change history (commits and tickets linked to an entity)
- Trigger manual ingestion for repos they have access to
- View ingestion run status and progress (all runs, not just their own)
- View connected repos and their entity/commit counts
- Export query results (copy, download)

**Restrictions:**
- Cannot invite, remove, or modify users
- Cannot connect or disconnect integrations
- Cannot add or remove repos
- Cannot cancel ingestion runs
- Cannot execute raw Cypher queries
- Cannot view other users' query history
- Cannot access org settings

---

### 2.5 Viewer

**Scope:** Single organization.

**Purpose:** Read-only stakeholder. Can see the knowledge graph and query results but cannot initiate any data operations. Ideal for product managers, external auditors, or compliance officers who need visibility without modification rights.

**Key capabilities:**
- View the dashboard (stats, health indicators)
- View the graph explorer (read-only, no modifications)
- View query results shared by Members/Admins (but cannot submit new queries)
- View repo list and repo detail pages
- View ingestion run history (status, not error logs)
- View integration status (connected/disconnected, not credentials)

**Restrictions:**
- Cannot submit queries
- Cannot trigger ingestion
- Cannot access ingestion error logs
- Cannot view integration credentials or test connections
- Cannot add repos
- Cannot invite or manage users
- Cannot access settings
- Cannot export data

---

## 3. Permission Matrix

### 3.1 Dashboard & Navigation

| Permission | Viewer | Member | Admin | Owner | Super Admin |
|---|---|---|---|---|---|
| View dashboard home | Yes | Yes | Yes | Yes | Yes |
| View platform analytics | -- | -- | -- | -- | Yes |
| Access sidebar navigation | Yes | Yes | Yes | Yes | Yes |
| Toggle light/dark theme | Yes | Yes | Yes | Yes | Yes |

### 3.2 Query Engine

| Permission | Viewer | Member | Admin | Owner | Super Admin |
|---|---|---|---|---|---|
| Submit natural-language queries | -- | Yes | Yes | Yes | Yes |
| View own query history | -- | Yes | Yes | Yes | Yes |
| View all users' query history | -- | -- | Yes | Yes | Yes |
| Execute raw Cypher (debug) | -- | -- | Yes | Yes | Yes |
| Export/copy query results | -- | Yes | Yes | Yes | Yes |
| View shared query results | Yes | Yes | Yes | Yes | Yes |

### 3.3 Graph Explorer

| Permission | Viewer | Member | Admin | Owner | Super Admin |
|---|---|---|---|---|---|
| View graph visualization | Yes | Yes | Yes | Yes | Yes |
| Navigate/expand graph nodes | Yes | Yes | Yes | Yes | Yes |
| Search graph nodes | -- | Yes | Yes | Yes | Yes |
| View entity detail | Yes | Yes | Yes | Yes | Yes |
| View entity change history | Yes | Yes | Yes | Yes | Yes |
| View graph statistics | Yes | Yes | Yes | Yes | Yes |
| Apply graph filters | -- | Yes | Yes | Yes | Yes |

### 3.4 Repositories

| Permission | Viewer | Member | Admin | Owner | Super Admin |
|---|---|---|---|---|---|
| View repo list | Yes | Yes | Yes | Yes | Yes |
| View repo detail | Yes | Yes | Yes | Yes | Yes |
| View repo entities | Yes | Yes | Yes | Yes | Yes |
| View repo commits | Yes | Yes | Yes | Yes | Yes |
| Add new repo | -- | -- | Yes | Yes | Yes |
| Remove repo (+ purge graph data) | -- | -- | Yes | Yes | Yes |

### 3.5 Integrations

| Permission | Viewer | Member | Admin | Owner | Super Admin |
|---|---|---|---|---|---|
| View integration status | Yes | Yes | Yes | Yes | Yes |
| View integration metadata | -- | -- | Yes | Yes | Yes |
| Connect integration (GitHub/Jira/Slack) | -- | -- | Yes | Yes | Yes |
| Disconnect integration | -- | -- | Yes | Yes | Yes |
| Test integration connection | -- | -- | Yes | Yes | Yes |
| View/manage encrypted credentials | -- | -- | -- | -- | -- |

> Encrypted credentials are never exposed in the UI at any role level. They are write-only from the API perspective.

### 3.6 Ingestion

| Permission | Viewer | Member | Admin | Owner | Super Admin |
|---|---|---|---|---|---|
| View ingestion run history | Yes | Yes | Yes | Yes | Yes |
| View run detail (stats) | Yes | Yes | Yes | Yes | Yes |
| View ingestion error logs | -- | -- | Yes | Yes | Yes |
| Trigger manual ingestion | -- | Yes | Yes | Yes | Yes |
| Cancel running ingestion | -- | -- | Yes | Yes | Yes |
| Configure ingestion schedule | -- | -- | Yes | Yes | Yes |
| View real-time ingestion status | -- | Yes | Yes | Yes | Yes |

### 3.7 User Management

| Permission | Viewer | Member | Admin | Owner | Super Admin |
|---|---|---|---|---|---|
| View org member list | -- | -- | Yes | Yes | Yes |
| Invite users (as Member) | -- | -- | Yes | Yes | Yes |
| Invite users (as Viewer) | -- | -- | Yes | Yes | Yes |
| Invite users (as Admin) | -- | -- | -- | Yes | Yes |
| Remove Member/Viewer | -- | -- | Yes | Yes | Yes |
| Remove Admin | -- | -- | -- | Yes | Yes |
| Change role: Viewer to Member | -- | -- | Yes | Yes | Yes |
| Change role: Member to Viewer | -- | -- | Yes | Yes | Yes |
| Change role: Member to Admin | -- | -- | -- | Yes | Yes |
| Change role: Admin to Member | -- | -- | -- | Yes | Yes |
| Transfer ownership | -- | -- | -- | Yes | -- |

### 3.8 Organization Settings

| Permission | Viewer | Member | Admin | Owner | Super Admin |
|---|---|---|---|---|---|
| View org name/slug | Yes | Yes | Yes | Yes | Yes |
| Edit org name/slug | -- | -- | Yes | Yes | Yes |
| View subscription tier | -- | -- | -- | Yes | Yes |
| Change subscription tier | -- | -- | -- | Yes | -- |
| View DPDP compliance settings | -- | -- | -- | Yes | Yes |
| Edit DPDP compliance settings | -- | -- | -- | Yes | -- |
| Generate org API keys | -- | -- | -- | Yes | -- |
| Revoke org API keys | -- | -- | -- | Yes | -- |
| View audit logs | -- | -- | -- | Yes | Yes |
| Export audit logs | -- | -- | -- | Yes | Yes |
| Delete organization | -- | -- | -- | Yes | Yes |

### 3.9 Platform Administration (Super Admin only)

| Permission | Viewer | Member | Admin | Owner | Super Admin |
|---|---|---|---|---|---|
| View all organizations | -- | -- | -- | -- | Yes |
| Suspend organization | -- | -- | -- | -- | Yes |
| Delete organization (any) | -- | -- | -- | -- | Yes |
| Impersonate user | -- | -- | -- | -- | Yes |
| View system health (DB, queue) | -- | -- | -- | -- | Yes |
| Manage feature flags | -- | -- | -- | -- | Yes |
| View platform-wide metrics | -- | -- | -- | -- | Yes |
| Set global rate limits | -- | -- | -- | -- | Yes |

---

## 4. Data Model

### 4.1 User Schema (MongoDB)

```typescript
interface User {
  _id: ObjectId;
  email: string;                    // unique across platform
  passwordHash: string | null;      // null for OAuth-only users
  name: string;
  avatarUrl: string | null;
  orgId: ObjectId;                  // ref: Organization
  role: 'super_admin' | 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  invitedBy: ObjectId | null;       // ref: User who sent invite
  invitedAt: Date | null;
  lastLoginAt: Date | null;
  githubId: string | null;         // OAuth linking
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.2 Invitation Schema (MongoDB)

```typescript
interface Invitation {
  _id: ObjectId;
  orgId: ObjectId;
  email: string;
  role: 'admin' | 'member' | 'viewer';   // cannot invite as owner or super_admin
  invitedBy: ObjectId;                     // ref: User
  token: string;                           // unique invite token (hashed)
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date;                         // 7 days from creation
  acceptedAt: Date | null;
  createdAt: Date;
}
```

### 4.3 Audit Log Schema (MongoDB)

Every role-sensitive action produces an audit log entry.

```typescript
interface AuditLog {
  _id: ObjectId;
  orgId: ObjectId;
  actorId: ObjectId;                // ref: User who performed the action
  actorEmail: string;               // denormalized for fast search
  actorRole: string;                // role at time of action
  action: AuditAction;             // enum (see below)
  targetType: 'user' | 'org' | 'integration' | 'repo' | 'ingestion' | 'query' | 'api_key';
  targetId: string;                 // ID of affected resource
  targetLabel: string;              // human-readable label ("jane@acme.com", "my-repo")
  details: Record<string, any>;     // action-specific metadata
  ip: string;
  userAgent: string;
  createdAt: Date;
}

type AuditAction =
  // User management
  | 'user.invited'
  | 'user.removed'
  | 'user.role_changed'
  | 'user.suspended'
  | 'user.reactivated'
  // Auth
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  // Org
  | 'org.settings_updated'
  | 'org.ownership_transferred'
  | 'org.deleted'
  | 'org.tier_changed'
  // Integration
  | 'integration.connected'
  | 'integration.disconnected'
  | 'integration.test_run'
  // Repo
  | 'repo.added'
  | 'repo.removed'
  // Ingestion
  | 'ingestion.triggered'
  | 'ingestion.cancelled'
  | 'ingestion.schedule_updated'
  // Query
  | 'query.raw_cypher_executed'
  // API Keys
  | 'api_key.generated'
  | 'api_key.revoked'
  // Super Admin
  | 'super_admin.impersonation_started'
  | 'super_admin.impersonation_ended'
  | 'super_admin.org_suspended'
  | 'super_admin.org_deleted';
```

---

## 5. Backend Implementation

### 5.1 Middleware Pattern

Authorization is enforced via Express middleware that checks the user's role against the required permission level for each route.

```typescript
// middleware/authorize.ts

type RoleLevel = {
  viewer: 1;
  member: 2;
  admin: 3;
  owner: 4;
  super_admin: 5;
};

const ROLE_LEVEL: RoleLevel = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
  super_admin: 5,
};

function authorize(minRole: keyof RoleLevel) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || ROLE_LEVEL[userRole] < ROLE_LEVEL[minRole]) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires ${minRole} role or higher.`,
        requiredRole: minRole,
        currentRole: userRole || 'unauthenticated',
      });
    }

    next();
  };
}
```

### 5.2 Route-Level Authorization

```typescript
// routes/repos.routes.ts

router.get('/repos',          authenticate, authorize('viewer'),  reposController.list);
router.get('/repos/:id',      authenticate, authorize('viewer'),  reposController.detail);
router.post('/repos',         authenticate, authorize('admin'),   reposController.create);
router.delete('/repos/:id',   authenticate, authorize('admin'),   reposController.remove);

// routes/query.routes.ts

router.post('/query',         authenticate, authorize('member'),  queryController.submit);
router.get('/query/history',  authenticate, authorize('member'),  queryController.history);
router.post('/query/cypher',  authenticate, authorize('admin'),   queryController.rawCypher);

// routes/org.routes.ts

router.get('/org/members',              authenticate, authorize('admin'),  orgController.listMembers);
router.post('/org/members/invite',      authenticate, authorize('admin'),  orgController.invite);
router.patch('/org/members/:id/role',   authenticate, authorize('admin'),  orgController.changeRole);
router.delete('/org/members/:id',       authenticate, authorize('admin'),  orgController.removeMember);
router.delete('/org',                   authenticate, authorize('owner'),  orgController.deleteOrg);
```

### 5.3 Fine-Grained Checks (beyond role level)

Some actions need logic beyond simple role comparison:

```typescript
// services/rbac.service.ts

function canChangeRole(actor: User, target: User, newRole: string): boolean {
  // Owner can do anything except self-demote below admin
  if (actor.role === 'owner') {
    if (actor._id.equals(target._id) && newRole !== 'owner') return false;
    return true;
  }

  // Admin can only change member <-> viewer
  if (actor.role === 'admin') {
    if (ROLE_LEVEL[target.role] >= ROLE_LEVEL['admin']) return false;
    if (ROLE_LEVEL[newRole] >= ROLE_LEVEL['admin']) return false;
    return true;
  }

  return false;
}

function canRemoveUser(actor: User, target: User): boolean {
  // Cannot remove yourself
  if (actor._id.equals(target._id)) return false;

  // Cannot remove someone at your level or above
  if (ROLE_LEVEL[target.role] >= ROLE_LEVEL[actor.role]) return false;

  return true;
}

function canInviteAsRole(actor: User, inviteRole: string): boolean {
  // Can only invite to roles below your own
  if (ROLE_LEVEL[inviteRole] >= ROLE_LEVEL[actor.role]) return false;

  // Cannot invite as owner or super_admin
  if (inviteRole === 'owner' || inviteRole === 'super_admin') return false;

  return true;
}
```

---

## 6. Frontend Implementation

### 6.1 UI Gating Strategy

The frontend hides UI elements the user cannot interact with. This is a UX convenience, not a security boundary (backend middleware is the real enforcement).

```typescript
// hooks/usePermissions.ts

interface Permissions {
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

function usePermissions(): Permissions {
  const { user } = useAuth();
  const level = ROLE_LEVEL[user?.role] || 0;

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
```

### 6.2 Sidebar Navigation Visibility

| Nav Item | Viewer | Member | Admin | Owner |
|---|---|---|---|---|
| Dashboard | Visible | Visible | Visible | Visible |
| Query | Hidden | Visible | Visible | Visible |
| Graph Explorer | Visible | Visible | Visible | Visible |
| Repos | Visible | Visible | Visible | Visible |
| Integrations | Hidden | Hidden | Visible | Visible |
| Ingestion | Visible (read) | Visible | Visible | Visible |
| Settings | Hidden | Hidden | Visible | Visible |

### 6.3 Page-Level Access Control

```typescript
// components/layout/ProtectedRoute.tsx

interface ProtectedRouteProps {
  minRole: 'viewer' | 'member' | 'admin' | 'owner';
  children: React.ReactNode;
}

function ProtectedRoute({ minRole, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageSkeleton />;
  if (!user) redirect('/login');
  if (ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) return <AccessDenied />;

  return children;
}
```

### 6.4 Conditional UI Elements

```tsx
// Example: Repo detail page

function RepoDetailPage() {
  const { canManageRepos, canTriggerIngestion } = usePermissions();

  return (
    <PageShell>
      <RepoHeader repo={repo} />
      <RepoStats repo={repo} />

      {canTriggerIngestion && (
        <Button onClick={handleTriggerIngestion}>
          <SyncOutlined /> Trigger Ingestion
        </Button>
      )}

      {canManageRepos && (
        <Button variant="danger" onClick={handleDeleteRepo}>
          <DeleteOutlined /> Remove Repository
        </Button>
      )}

      <IngestionHistory repoId={repo._id} />
    </PageShell>
  );
}
```

---

## 7. Invitation Flow

```
Admin/Owner clicks "Invite User"
       |
       v
  Enter email + select role
  (role options filtered by canInviteAsRole)
       |
       v
  Backend creates Invitation record
  (token hashed, expires in 7 days)
       |
       v
  Email sent with invite link:
  /signup?invite=<token>
       |
       v
  Invitee clicks link -> signup page
  (email pre-filled, org auto-assigned)
       |
       v
  On signup, Invitation.status = 'accepted'
  User created with Invitation.role
       |
       v
  Audit log: 'user.invited' (on invite)
  Audit log: 'auth.login' (on first login)
```

### Invitation Rules

| Rule | Enforced By |
|---|---|
| Cannot invite to a role equal to or above your own | `canInviteAsRole()` in backend |
| Cannot invite as Owner or Super Admin | Hard-coded check |
| Invitations expire after 7 days | TTL check on accept |
| Duplicate email to same org is rejected | Unique index on `(orgId, email)` |
| Owner can revoke pending invitations | `DELETE /org/invitations/:id` |
| Admin can revoke invitations they created | Scoped to `invitedBy` match |

---

## 8. Ownership Transfer

A critical, irreversible operation. The current Owner transfers their role to another user in the org.

```
Owner opens Settings -> "Transfer Ownership"
       |
       v
  Select target user (must be Admin or Member in same org)
       |
       v
  Confirmation modal:
  "This will make [User] the new Owner.
   You will be demoted to Admin.
   This action cannot be undone."
       |
       v
  Re-authenticate (password or OAuth re-confirm)
       |
       v
  Backend transaction:
    1. Set target user's role to 'owner'
    2. Set current user's role to 'admin'
    3. Create audit log: 'org.ownership_transferred'
       |
       v
  Both users receive notification
```

---

## 9. API Key Scoping

Org-level API keys (generated by Owner) are used for programmatic access (CI/CD integration, external tools).

```typescript
interface ApiKey {
  _id: ObjectId;
  orgId: ObjectId;
  name: string;                     // "CI Pipeline Key"
  keyHash: string;                  // SHA-256 hash of the key (key itself shown once)
  keyPrefix: string;                // "rcx_...abc" (first/last 4 chars for identification)
  permissions: ApiKeyPermission[];  // scoped permissions
  createdBy: ObjectId;              // ref: User (must be Owner)
  lastUsedAt: Date | null;
  expiresAt: Date | null;           // null = never expires
  status: 'active' | 'revoked';
  createdAt: Date;
}

type ApiKeyPermission =
  | 'query:submit'          // POST /api/query
  | 'graph:read'            // GET /api/graph/*
  | 'repos:read'            // GET /api/repos/*
  | 'ingestion:trigger'     // POST /api/ingestion/trigger
  | 'ingestion:read';       // GET /api/ingestion/*
```

API keys never have user management, settings, or integration permissions. They are scoped to data operations only.

---

## 10. Session & Token Rules

| Rule | Value |
|---|---|
| JWT expiry | 7 days |
| Refresh token | Not used in Phase 1 (re-login on expiry) |
| Token payload | `{ userId, orgId, role, iat, exp }` |
| Role change effect | Immediate on next request (JWT role is re-checked against DB on sensitive operations) |
| Suspension effect | Immediate (middleware checks `user.status === 'active'`) |
| Concurrent sessions | Allowed (no session invalidation on new login) |
| Password change | Does not invalidate existing tokens (Phase 1); add token revocation in Phase 3 |

---

## 11. Edge Cases & Rules

| Scenario | Behavior |
|---|---|
| Owner tries to leave org | Blocked. Must transfer ownership first. |
| Last Admin is removed | Allowed. Owner can always manage users directly. |
| User invited to org they are already in | Rejected with "User already in organization" error. |
| Super Admin accesses org data | Read-only by default. Write actions require explicit impersonation mode. |
| User's role is changed while they have active session | Next API request uses updated role. UI updates on next page navigation. |
| Org is suspended by Super Admin | All users in org get 403 on all endpoints. Login still works but dashboard shows suspension notice. |
| Invitation accepted after role of inviter was demoted | Invitation is still valid at the originally assigned role. |
| Owner deletes org | All users lose access immediately. Graph data purged. MongoDB records soft-deleted (retained 30 days for recovery). |

---

## 12. Rate Limits by Role

| Endpoint Category | Viewer | Member | Admin | Owner |
|---|---|---|---|---|
| Query submissions | -- | 30/hour | 100/hour | 200/hour |
| Graph explore | 60/hour | 120/hour | 300/hour | 500/hour |
| Ingestion triggers | -- | 5/hour | 20/hour | 50/hour |
| Raw Cypher execution | -- | -- | 10/hour | 30/hour |
| User invitations | -- | -- | 20/day | 50/day |
| API key generation | -- | -- | -- | 10/day |

Rate limits are enforced per-user via Redis (`ioredis` + sliding window counter). 429 response includes `Retry-After` header.

---

## 13. Audit Trail Requirements

Every action in the permission matrix that modifies state must produce an audit log entry. The following actions are always audited regardless of success/failure:

| Category | Audited Actions |
|---|---|
| Authentication | Login, logout, failed login, OAuth link |
| User management | Invite sent, invite accepted, role changed, user removed, user suspended |
| Organization | Settings updated, tier changed, ownership transferred, org deleted |
| Integrations | Connected, disconnected, connection tested |
| Repositories | Added, removed |
| Ingestion | Triggered, cancelled, schedule updated |
| Queries | Raw Cypher executed (not regular NL queries, to avoid log bloat) |
| API Keys | Generated, revoked |
| Super Admin | Impersonation started/ended, org suspended/deleted |

Audit logs are append-only. No user, including Super Admin, can delete or modify audit log entries. Retention: 1 year minimum (configurable per org for Enterprise tier).

---

*Last updated: 2026-07-13*
