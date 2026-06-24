'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppTopbar } from '@/components/app-topbar'
import { useAuth } from '@/components/auth-context'

const TITLES: Record<string, string> = {
  '/app/chat': 'Chat',
  '/app/graph': 'Knowledge Graph',
  '/app/dashboard': 'Knowledge Risk Dashboard',
  '/app/integrations': 'Integrations',
  '/app/settings': 'Organization Settings',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, member } = useAuth()

  useEffect(() => {
    // Client-side guard mirrors the middleware for the mock session.
    if (member === null && !isAuthenticated) {
      const raw =
        typeof window !== 'undefined'
          ? localStorage.getItem('emos.session')
          : null
      if (!raw) router.replace('/login')
    }
  }, [isAuthenticated, member, router])

  const title =
    Object.entries(TITLES).find(([prefix]) =>
      pathname.startsWith(prefix),
    )?.[1] ?? 'Engineering Memory OS'

  if (!member) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-svh gap-3 overflow-hidden p-3">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <AppTopbar title={title} />
        <main className="glass-panel min-h-0 flex-1 overflow-hidden rounded-3xl">
          {children}
        </main>
      </div>
    </div>
  )
}
