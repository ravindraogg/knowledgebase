'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GitGraph,
  MessageSquare,
  Network,
  Plug,
  Settings,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-context'
import type { Permission } from '@/lib/rbac'

interface NavItem {
  href: string
  label: string
  icon: typeof MessageSquare
  permission: Permission
}

const NAV_ITEMS: NavItem[] = [
  { href: '/app/chat', label: 'Chat', icon: MessageSquare, permission: 'chat' },
  { href: '/app/graph', label: 'Knowledge Graph', icon: Network, permission: 'graph' },
  { href: '/app/dashboard', label: 'Risk Dashboard', icon: ShieldAlert, permission: 'dashboard' },
  { href: '/app/integrations', label: 'Integrations', icon: Plug, permission: 'integrations' },
  { href: '/app/settings', label: 'Settings', icon: Settings, permission: 'settings' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { can } = useAuth()
  const items = NAV_ITEMS.filter((item) => can(item.permission))

  return (
    <aside className="glass-panel hidden w-60 shrink-0 flex-col overflow-hidden rounded-3xl md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border/60 px-4">
        <div className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-spatial-sm">
          <GitGraph className="size-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Memory OS</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            v0.1
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-sidebar-accent text-foreground shadow-spatial-sm'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
              )}
            >
              <Icon
                className={cn('size-4', active && 'text-primary')}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border/60 p-3">
        <p className="text-pretty font-mono text-[10px] leading-relaxed text-muted-foreground">
          Connect GitHub, Jira & Slack from Integrations to ingest your
          engineering history.
        </p>
      </div>
    </aside>
  )
}
