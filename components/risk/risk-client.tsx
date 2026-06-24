"use client"

import useSWR from "swr"
import { AlertTriangle, Users, ShieldAlert, UserMinus, Loader2 } from "lucide-react"
import type { ModuleRisk } from "@/lib/types"
import type { RiskSummary } from "@/lib/risk-engine"
import { fetcher } from "@/lib/fetcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RiskResponse {
  summary: RiskSummary
  modules: ModuleRisk[]
}

function busFactorTone(bf: number) {
  if (bf <= 1) return { label: "Critical", className: "bg-destructive/15 text-destructive border-destructive/30" }
  if (bf === 2) return { label: "High", className: "bg-warning/15 text-warning border-warning/30" }
  if (bf === 3) return { label: "Moderate", className: "bg-chart-3/15 text-chart-3 border-chart-3/30" }
  return { label: "Healthy", className: "bg-success/15 text-success border-success/30" }
}

const KPI_ICONS = { AlertTriangle, Users, ShieldAlert, UserMinus }

export function RiskClient() {
  const { data, isLoading } = useSWR<RiskResponse>("/api/risk", fetcher)

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Analyzing knowledge risk...
      </div>
    )
  }

  const { summary, modules } = data

  const kpis = [
    {
      icon: "AlertTriangle" as const,
      label: "Modules at Risk",
      value: String(summary.modulesAtRisk),
      hint: "bus factor ≤ 2",
      tone: "text-destructive",
    },
    {
      icon: "Users" as const,
      label: "Avg Bus Factor",
      value: summary.averageBusFactor.toFixed(1),
      hint: "across all modules",
      tone: "text-foreground",
    },
    {
      icon: "ShieldAlert" as const,
      label: "Knowledge Concentration",
      value: `${summary.knowledgeConcentrationScore}%`,
      hint: "avg single-owner share",
      tone: "text-warning",
    },
    {
      icon: "UserMinus" as const,
      label: "Offboarding Risks",
      value: String(summary.pendingOffboardingRisks),
      hint: "pending departures",
      tone: "text-foreground",
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = KPI_ICONS[kpi.icon]
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-start justify-between gap-3 p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className={cn("mt-2 text-3xl font-semibold tabular-nums", kpi.tone)}>{kpi.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
                </div>
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className={cn("size-5", kpi.tone)} />
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bus factor table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Module Bus Factor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.map((m) => {
            const tone = busFactorTone(m.busFactor)
            return (
              <div key={m.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                      {m.busFactor}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{m.moduleName}</p>
                      <p className="text-xs text-muted-foreground">
                        Primary owner: {m.primaryOwner} · Updated {m.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("gap-1", tone.className)}>
                    {tone.label}
                  </Badge>
                </div>

                {/* Contributor concentration bar */}
                <div className="mt-4">
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    {m.contributors.map((c, i) => (
                      <div
                        key={c.name}
                        className="h-full"
                        style={{
                          width: `${c.concentration}%`,
                          backgroundColor: `var(--chart-${(i % 5) + 1})`,
                        }}
                        title={`${c.name}: ${c.concentration}%`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {m.contributors.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: `var(--chart-${(i % 5) + 1})` }}
                        />
                        {c.name}
                        <span className="tabular-nums text-foreground/70">{c.concentration}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
