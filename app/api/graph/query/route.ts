import { NextResponse } from 'next/server'
import { queryGraph } from '@/lib/graph-engine'
import { DEMO_ORG } from '@/lib/mock-data'

// GET /api/graph/query?q=...  → returns nodes/edges from the graph engine.
// Backed by lib/graph-engine.ts (currently mock, later Neo4j/GraphRAG).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? undefined
  const orgId = searchParams.get('orgId') ?? DEMO_ORG.id
  const data = await queryGraph(orgId, q)
  return NextResponse.json(data)
}
