'use client'

import { useRouter } from 'next/navigation'
import { Building2, ChevronsUpDown, LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/components/auth-context'
import { ROLE_LABELS } from '@/lib/rbac'

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AppTopbar({ title }: { title: string }) {
  const router = useRouter()
  const { member, org, logout } = useAuth()
  if (!member || !org) return null

  return (
    <header className="glass-panel flex h-14 shrink-0 items-center justify-between gap-4 rounded-3xl px-4">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Org switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2">
                <Building2 className="size-3.5 text-muted-foreground" />
                <span className="max-w-32 truncate">{org.name}</span>
                <ChevronsUpDown className="size-3.5 text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuItem>
              <Building2 className="size-4" />
              {org.name}
              <Badge variant="secondary" className="ml-auto">
                Active
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Building2 className="size-4" />
              Add organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="User menu">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary/15 text-xs text-primary">
                    {initials(member.user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 text-xs text-primary">
                  {initials(member.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {member.user.name}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {member.user.email}
                </span>
              </div>
            </div>
            <div className="px-2 pb-1.5">
              <Badge variant="outline" className="gap-1">
                {ROLE_LABELS[member.role]}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                logout()
                router.push('/login')
              }}
            >
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
