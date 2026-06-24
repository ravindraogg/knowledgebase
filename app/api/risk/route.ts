import { NextResponse } from 'next/server'
import { getRiskSummary, listModuleRisks } from '@/lib/risk-engine'
import { DEMO_ORG } from '@/lib/mock-data'

// GET /api/risk  → KPI summary + per-module bus-factor rows.
// Backed by lib/risk-engine.ts (currently mock).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('orgId') ?? DEMO_ORG.id
  const [summary, modules] = await Promise.all([
    getRiskSummary(orgId),
    listModuleRisks(orgId),
  ])
  return NextResponse.json({ summary, modules })
}
