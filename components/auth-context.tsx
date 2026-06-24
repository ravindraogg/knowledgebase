'use client'

// Auth/RBAC context backed by the Express + Postgres API. Holds the current
// session (member + org) resolved from a bearer token stored in localStorage.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Organization, OrganizationMember } from '@/lib/types'
import { can as canDo, type Permission } from '@/lib/rbac'
import { apiFetch, getToken, setToken } from '@/lib/api'

interface SessionState {
  member: OrganizationMember
  org: Organization
}

interface AuthContextValue {
  member: OrganizationMember | null
  org: Organization | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: { email: string; name: string; password: string; orgName: string }) => Promise<void>
  logout: () => void
  setOrg: (org: Organization) => void
  refresh: () => Promise<void>
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(true)

  // Resolve the session from a stored token on mount.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    apiFetch<SessionState>('/api/auth/me')
      .then((data) => setSession(data))
      .catch(() => {
        setToken(null)
        setSession(null)
      })
      .finally(() => setLoading(false))
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

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ token: string } & SessionState>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    setSession({ member: data.member, org: data.org })
  }, [])

  const signup = useCallback(
    async (input: { email: string; name: string; password: string; orgName: string }) => {
      const data = await apiFetch<{ token: string } & SessionState>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      setToken(data.token)
      setSession({ member: data.member, org: data.org })
    },
    [],
  )

  const logout = useCallback(() => {
    setToken(null)
    setSession(null)
  }, [])

  const setOrg = useCallback((org: Organization) => {
    setSession((prev) => (prev ? { ...prev, org } : prev))
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) return
    const data = await apiFetch<SessionState>('/api/auth/me')
    setSession(data)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      member: session?.member ?? null,
      org: session?.org ?? null,
      loading,
      isAuthenticated: !!session,
      login,
      signup,
      logout,
      setOrg,
      refresh,
      can: (permission: Permission) =>
        session ? canDo(session.member.role, permission) : false,
    }),
    [session, loading, login, signup, logout, setOrg, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
