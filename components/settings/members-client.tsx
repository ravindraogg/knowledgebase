"use client"

import { useState } from "react"
import useSWR from "swr"
import { Loader2, UserPlus } from "lucide-react"
import type { OrganizationMember, Role } from "@/lib/types"
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/rbac"
import { fetcher } from "@/lib/fetcher"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
}

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-primary/15 text-primary border-primary/30",
  engineer: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  viewer: "bg-muted text-muted-foreground border-border",
}

export function MembersClient({ canManage }: { canManage: boolean }) {
  const { data } = useSWR<{ members: OrganizationMember[] }>("/api/members", fetcher)
  const [roles, setRoles] = useState<Record<string, Role>>({})
  const [inviteOpen, setInviteOpen] = useState(false)

  const members = data?.members ?? []

  if (!data) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading members...
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{members.length} members</p>
        {canManage && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Invite member
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Member</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Last active</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const role = roles[m.id] ?? m.role
              return (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-secondary text-xs">{initials(m.user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{m.user.name}</p>
                        <p className="text-xs text-muted-foreground">{m.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {new Date(m.lastActive).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <Select value={role} onValueChange={(v) => setRoles((p) => ({ ...p, [m.id]: v as Role }))}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={cn(ROLE_BADGE[role])}>
                        {ROLE_LABELS[role]}
                      </Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>They&apos;ll receive an email invitation to join your organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="invite-email" className="text-sm font-medium">
                Email address
              </label>
              <Input id="invite-email" type="email" placeholder="teammate@company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select defaultValue="engineer">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      <div>
                        <p>{ROLE_LABELS[r]}</p>
                        <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={() => setInviteOpen(false)}>
              <UserPlus className="size-4" />
              Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
