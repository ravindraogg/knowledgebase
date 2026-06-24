import { Pool } from "pg"

const rawConnectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL

if (!rawConnectionString) {
  throw new Error(
    "[server] No Postgres connection string found. Expected POSTGRES_URL in the environment.",
  )
}

// Strip any sslmode param so it doesn't force certificate verification — Supabase
// presents a self-signed chain, which we accept explicitly via the ssl option below.
function stripSslMode(url: string): string {
  return url.replace(/([?&])sslmode=[^&]*/i, "$1").replace(/[?&]$/, "").replace(/&&/g, "&")
}

// Supabase requires SSL. The pooled connection string works for serverless-style access.
export const pool = new Pool({
  connectionString: stripSslMode(rawConnectionString),
  ssl: { rejectUnauthorized: false },
  max: 10,
})

/** Small helper for parameterized queries. */
export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params)
  return res.rows as T[]
}

/** Run a set of statements inside a transaction. */
export async function withTransaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}
