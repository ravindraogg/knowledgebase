import { RiskClient } from "@/components/risk/risk-client"

export default function RiskPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Risk Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Surface knowledge concentration and bus-factor risk across your codebase before it becomes a problem.
        </p>
      </div>
      <RiskClient />
    </div>
  )
}
