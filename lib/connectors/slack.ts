// STUB: Replace with real implementation — see project notes.
// Will later handle real Slack OAuth + public-channel message ingestion
// (excludes DMs and private channels by default).

export async function connect(orgId: string) {
  void orgId
  return { ok: true, status: 'connected' as const }
}

export async function sync(orgId: string) {
  void orgId
  return { ok: true, syncedAt: new Date().toISOString() }
}
