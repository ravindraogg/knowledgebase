"use client"

import { ConnectorsClient } from "@/components/integrations/connectors-client"
import { useAuth } from "@/components/auth-context"

export default function IntegrationsPage() {
  const { can } = useAuth()
  const canManage = can("integrations")

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Connect your engineering tools. We ingest history read-only to build your organization&apos;s memory graph.
        </p>
      </div>
      <ConnectorsClient canManage={canManage} />
    </div>
  )
}
