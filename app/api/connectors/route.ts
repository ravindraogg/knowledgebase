import { NextResponse } from 'next/server'
import { DEMO_CONNECTORS, DEMO_ORG } from '@/lib/mock-data'
import * as github from '@/lib/connectors/github'
import * as jira from '@/lib/connectors/jira'
import * as slack from '@/lib/connectors/slack'
import type { ConnectorType } from '@/lib/types'

const ENGINES = { github, jira, slack }

// GET /api/connectors → list connector configs.
export async function GET() {
  return NextResponse.json({ connectors: DEMO_CONNECTORS })
}

// POST /api/connectors { type, action: 'connect' | 'sync' }
// Backed by lib/connectors/*.ts (currently mock OAuth + sync).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { type, action = 'connect', orgId = DEMO_ORG.id } = body as {
    type: ConnectorType
    action: 'connect' | 'sync'
    orgId?: string
  }
  const engine = ENGINES[type]
  if (!engine) {
    return NextResponse.json({ error: 'unknown connector' }, { status: 400 })
  }
  const result = action === 'sync' ? await engine.sync(orgId) : await engine.connect(orgId)
  return NextResponse.json(result)
}
