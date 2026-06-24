import { query } from "./db"

const HF_MODEL = process.env.HF_MODEL || "Qwen/Qwen2.5-72B-Instruct"
const HF_API_KEY = process.env.HF_API_KEY
// OpenAI-compatible router endpoint for Hugging Face inference providers.
const HF_ENDPOINT = "https://router.huggingface.co/v1/chat/completions"

export interface RetrievedDoc {
  id: string
  kind: "pr" | "slack" | "function" | "jira" | "adr"
  title: string
  meta: string | null
  body: string
  language: string | null
}

/**
 * Retrieval step: full-text search over the org's ingested documents.
 * Falls back to most-recent documents when the query has no lexical matches
 * so the model still has grounding context to work with.
 */
export async function retrieve(orgId: string, question: string, limit = 5): Promise<RetrievedDoc[]> {
  const ranked = await query<RetrievedDoc>(
    `select id, kind, title, meta, body, language
       from documents
      where org_id = $1
        and search @@ websearch_to_tsquery('english', $2)
      order by ts_rank(search, websearch_to_tsquery('english', $2)) desc
      limit $3`,
    [orgId, question, limit],
  )
  if (ranked.length > 0) return ranked

  return query<RetrievedDoc>(
    `select id, kind, title, meta, body, language
       from documents
      where org_id = $1
      order by created_at desc
      limit $2`,
    [orgId, limit],
  )
}

function buildContext(docs: RetrievedDoc[]): string {
  if (docs.length === 0) return "No source documents are available yet."
  return docs
    .map((d, i) => `[${i + 1}] (${d.kind}) ${d.title}\n${d.meta ?? ""}\n${d.body}`.trim())
    .join("\n\n---\n\n")
}

const SYSTEM_PROMPT = `You are the Engineering Memory OS assistant. You answer questions about an engineering organization's history, decisions, code ownership, and rationale.

Rules:
- Answer ONLY from the provided SOURCES. If the sources do not contain the answer, say you don't have enough indexed context yet.
- Be concise and concrete. Reference people, PRs, decisions, and tickets by name.
- When you use a source, cite it inline using its bracket number, e.g. [1], [2].
- Never invent commit hashes, names, or dates that are not in the sources.`

/**
 * Generation step: call the Qwen model on Hugging Face with the retrieved
 * context. Returns the answer text.
 */
async function generate(question: string, docs: RetrievedDoc[]): Promise<string> {
  if (!HF_API_KEY) {
    throw new Error("HF_API_KEY is not configured on the server.")
  }

  const context = buildContext(docs)
  const res = await fetch(HF_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `SOURCES:\n${context}\n\nQUESTION: ${question}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 700,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Hugging Face request failed (${res.status}): ${detail.slice(0, 300)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  return data.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response."
}

export interface RagResult {
  answer: string
  citations: {
    id: string
    kind: RetrievedDoc["kind"]
    label: string
    source: { title: string; meta: string; body: string; language?: string }
  }[]
  decisionTrail: { id: string; label: string; type: "person" | "code" | "decision" | "work_item" | "event" }[]
}

const KIND_TO_NODE: Record<RetrievedDoc["kind"], "code" | "decision" | "work_item" | "event"> = {
  pr: "code",
  function: "code",
  adr: "decision",
  jira: "work_item",
  slack: "event",
}

/** Full RAG pipeline: retrieve -> generate -> assemble citations + trail. */
export async function answerQuestion(orgId: string, question: string): Promise<RagResult> {
  const docs = await retrieve(orgId, question)
  const answer = await generate(question, docs)

  const citations = docs.map((d) => ({
    id: d.id,
    kind: d.kind,
    label: d.title,
    source: {
      title: d.title,
      meta: d.meta ?? "",
      body: d.body,
      language: d.language ?? undefined,
    },
  }))

  const decisionTrail = docs.slice(0, 4).map((d) => ({
    id: d.id,
    label: d.title,
    type: KIND_TO_NODE[d.kind],
  }))

  return { answer, citations, decisionTrail }
}
