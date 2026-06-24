import { NextResponse } from 'next/server'
import { getChatResponse } from '@/lib/ai-chat'
import { DEMO_ORG } from '@/lib/mock-data'

// POST /api/chat  { message, history, orgId }
// Backed by lib/ai-chat.ts (currently canned, later LLM + GraphRAG).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { message, history = [], orgId = DEMO_ORG.id } = body
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }
  const reply = await getChatResponse(orgId, message, history)
  return NextResponse.json(reply)
}
