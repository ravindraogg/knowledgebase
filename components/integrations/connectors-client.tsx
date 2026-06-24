"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import {
  GitBranch,
  SquareKanban,
  MessagesSquare,
  Check,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Lock,
  Plug,
} from "lucide-react"
import type { Connector, ConnectorType, ConnectorStatus } from "@/lib/types"
import { fetcher } from "@/lib/fetcher"
import { apiFetch } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const META: Record<ConnectorType, { name: string; icon: typeof GitBranch; blurb: string; accent: string }> = {
  github: {
    name: "GitHub",
    icon: GitBranch,
    blurb: "Pull requests, commits, and code reviews",
    accent: "text-foreground",
  },
  jira: {
    name: "Jira",
    icon: SquareKanban,
    blurb: "Issues, tickets, and project history",
    accent: "text-[oklch(0.6_0.18_250)]",
  },
  slack: {
    name: "Slack",
    icon: MessagesSquare,
    blurb: "Public channel discussions and decisions",
    accent: "text-[oklch(0.7_0.16_330)]",
  },
}

function statusBadge(status: ConnectorStatus) {
  switch (status) {
    case "connected":
      return { label: "Connected", className: "bg-success/15 text-success border-success/30", icon: Check }
    case "syncing":
      return { label: "Syncing", className: "bg-chart-3/15 text-chart-3 border-chart-3/30", icon: RefreshCw }
    case "error":
      return { label: "Error", className: "bg-destructive/15 text-destructive border-destructive/30", icon: Plug }
    default:
      return { label: "Not connected", className: "bg-muted text-muted-foreground border-border", icon: Plug }
  }
}

export function ConnectorsClient({ canManage }: { canManage: boolean }) {
  const { data } = useSWR<{ connectors: Connector[] }>("/api/connectors", fetcher)
  const [dialogType, setDialogType] = useState<ConnectorType | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [optimistic, setOptimistic] = useState<Record<string, ConnectorStatus>>({})

  const connectors = data?.connectors ?? []
  const dialogConnector = connectors.find((c) => c.type === dialogType) ?? null

  async function confirmConnect() {
    if (!dialogConnector) return
    setConnecting(true)
    await fetch("/api/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: dialogConnector.type, action: "connect" }),
    })
    // Simulate OAuth round-trip latency.
    await new Promise((r) => setTimeout(r, 1200))
    setOptimistic((p) => ({ ...p, [dialogConnector.id]: "connected" }))
    setConnecting(false)
    setDialogType(null)
    mutate("/api/connectors")
  }

  async function triggerSync(c: Connector) {
    setOptimistic((p) => ({ ...p, [c.id]: "syncing" }))
    await fetch("/api/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: c.type, action: "sync" }),
    })
    await new Promise((r) => setTimeout(r, 1400))
    setOptimistic((p) => ({ ...p, [c.id]: "connected" }))
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connectors.map((c) => {
          const meta = META[c.type]
          const Icon = meta.icon
          const status = optimistic[c.id] ?? c.status
          const badge = statusBadge(status)
          const BadgeIcon = badge.icon
          const isConnected = status === "connected"
          const isSyncing = status === "syncing"

          return (
            <Card key={c.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
                      <Icon className={cn("size-5", meta.accent)} />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{meta.name}</p>
                      <p className="text-xs text-muted-foreground">{meta.blurb}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("gap-1", badge.className)}>
                    <BadgeIcon className={cn("size-3", isSyncing && "animate-spin")} />
                    {badge.label}
                  </Badge>
                </div>

                <dl className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                  {c.scopeConfig.details.map((d) => (
                    <div key={d.label} className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">{d.label}</dt>
                      <dd className="truncate font-medium text-foreground">{d.value}</dd>
                    </div>
                  ))}
                  {c.lastSyncedAt && (
                    <div className="flex items-center justify-between gap-3 border-t border-border pt-1.5">
                      <dt className="text-muted-foreground">Last synced</dt>
                      <dd className="font-mono text-foreground/80">
                        {new Date(c.lastSyncedAt).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-auto flex gap-2">
                  {isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={!canManage || isSyncing}
                      onClick={() => triggerSync(c)}
                    >
                      <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
                      {isSyncing ? "Syncing..." : "Sync now"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!canManage}
                      onClick={() => setDialogType(c.type)}
                    >
                      <Plug className="size-4" />
                      Connect
                    </Button>
                  )}
                </div>
                {!canManage && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="size-3" />
                    Admin role required to manage connectors
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* OAuth scope consent dialog */}
      <Dialog open={dialogType !== null} onOpenChange={(o) => !o && setDialogType(null)}>
        <DialogContent>
          {dialogConnector && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
                    {(() => {
                      const Icon = META[dialogConnector.type].icon
                      return <Icon className={cn("size-5", META[dialogConnector.type].accent)} />
                    })()}
                  </span>
                  <div>
                    <DialogTitle>Connect {META[dialogConnector.type].name}</DialogTitle>
                    <DialogDescription>Authorize read-only access to ingest engineering history.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Requested permissions
                </p>
                <ul className="space-y-2">
                  {dialogConnector.scopeConfig.scopes.map((scope) => (
                    <li key={scope} className="flex items-start gap-2 text-sm text-foreground">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />
                      {scope}
                    </li>
                  ))}
                </ul>
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  We only request read scopes. Private channels and DMs are excluded by default. You can revoke access
                  at any time.
                </p>
              </div>

              <DialogFooter showCloseButton>
                <Button onClick={confirmConnect} disabled={connecting}>
                  {connecting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      Authorize &amp; Connect
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
