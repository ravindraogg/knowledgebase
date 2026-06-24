'use client'

// Mock auth/RBAC context for the UI shell. Holds the current session (user +
// role + org). A future Supabase Auth implementation can replace the internals
// while keeping this hook's surface identical.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { DEMO_MEMBERS, DEMO_ORG } from '@/lib/mock-data'
import type { Organization, OrganizationMember, Role } from '@/lib/types'
import { can as canDo, type Permission } from '@/lib/rbac'

const SESSION_KEY = 'emos.session'

interface SessionState {
  member: OrganizationMember
  org: Organization
}

interface AuthContextValue {
  member: OrganizationMember | null
  org: Organization | null
  isAuthenticated: boolean
  login: (email: string) => void
  logout: () => void
  setRole: (role: Role) => void
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) setSession(JSON.parse(raw))
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  // Mirror the role into a cookie so server middleware can gate routes.
  useEffect(() => {
    const role = session?.member.role
    if (role) {
      document.cookie = `emos_role=${role}; path=/; max-age=86400; samesite=lax`
    } else {
      document.cookie = 'emos_role=; path=/; max-age=0; samesite=lax'
    }
  }, [session])

  const persist = useCallback((next: SessionState | null) => {
    setSession(next)
    try {
      if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  }, [])

  const login = useCallback(
    (email: string) => {
      const matched =
        DEMO_MEMBERS.find(
          (m) => m.user.email.toLowerCase() === email.toLowerCase(),
        ) ?? DEMO_MEMBERS[0]
      persist({ member: matched, org: DEMO_ORG })
    },
    [persist],
  )

  const logout = useCallback(() => persist(null), [persist])

  const setRole = useCallback(
    (role: Role) => {
      setSession((prev) => {
        if (!prev) return prev
        const next = { ...prev, member: { ...prev.member, role } }
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(next))
        } catch {
          // ignore
        }
        return next
      })
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      member: session?.member ?? null,
      org: session?.org ?? null,
      isAuthenticated: hydrated && !!session,
      login,
      logout,
      setRole,
      can: (permission: Permission) =>
        session ? canDo(session.member.role, permission) : false,
    }),
    [session, hydrated, login, logout, setRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
