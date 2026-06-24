"use client"

import { useState } from "react"
import { Cloud, Server, Building2, Trash2, Shield, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { apiFetch } from "@/lib/api"
import { MembersClient } from "@/components/settings/members-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { org, member, can, refresh } = useAuth()
  const canManage = can("settings")
  const [mode, setMode] = useState(org?.deploymentMode ?? "cloud")
  const [name, setName] = useState(org?.name ?? "")
  const [saving, setSaving] = useState(false)

  async function saveProfile() {
    setSaving(true)
    try {
      await apiFetch("/api/org", { method: "PATCH", body: JSON.stringify({ name }) })
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  async function changeMode(next: "cloud" | "byoc") {
    setMode(next)
    await apiFetch("/api/org", { method: "PATCH", body: JSON.stringify({ deploymentMode: next }) })
    await refresh()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Organization Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your organization profile, members, and deployment.</p>
      </div>

      {!canManage && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Shield className="size-4" />
          You have {member?.role} access. Some settings are read-only.
        </div>
      )}

      {/* Org profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-muted-foreground" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-id">Organization ID</Label>
              <Input id="org-id" defaultValue={org?.id} disabled className="font-mono" />
            </div>
          </div>
          {canManage && (
            <div className="flex justify-end">
              <Button size="sm" onClick={saveProfile} disabled={saving || !name.trim()}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deployment mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deployment Mode</CardTitle>
          <CardDescription>Choose where your organization&apos;s data is processed and stored.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { id: "cloud", icon: Cloud, title: "Cloud (SaaS)", desc: "Managed multi-tenant hosting. Fastest to set up." },
              { id: "byoc", icon: Server, title: "Bring Your Own Cloud", desc: "Deploy into your own VPC for full data residency." },
            ] as const
          ).map((opt) => {
            const Icon = opt.icon
            const active = mode === opt.id
            return (
              <button
                key={opt.id}
                disabled={!canManage}
                onClick={() => changeMode(opt.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-70",
                  active ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
                  {active && <Badge className="bg-primary/15 text-primary">Active</Badge>}
                </div>
                <p className="font-medium text-foreground">{opt.title}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members &amp; Roles</CardTitle>
          <CardDescription>Control who can access the workspace and what they can do.</CardDescription>
        </CardHeader>
        <CardContent>
          <MembersClient canManage={canManage} />
        </CardContent>
      </Card>

      {/* Danger zone */}
      {canManage && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <Trash2 className="size-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Delete organization</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove this organization and all ingested memory. This cannot be undone.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete organization
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
