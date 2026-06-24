// STUB: Replace with real implementation — see project notes.
// Will later handle real GitHub OAuth token exchange + webhook ingestion.

export async function connect(orgId: string) {
  void orgId
  // Future: redirect to GitHub OAuth, exchange code, persist installation token.
  return { ok: true, status: 'connected' as const }
}

export async function sync(orgId: string) {
  void orgId
  // Future: pull PRs, commits, and reviews; feed the ingestion pipeline.
  return { ok: true, syncedAt: new Date().toISOString() }
}
