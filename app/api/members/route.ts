import { NextResponse } from 'next/server'
import { DEMO_MEMBERS } from '@/lib/mock-data'

// GET /api/members → organization members with roles.
export async function GET() {
  return NextResponse.json({ members: DEMO_MEMBERS })
}
