import { Router } from "express"
import { query } from "../db"
import { requireAuth, requireRole, type AuthedRequest } from "../auth"
import { mapSession, mapMessage } from "../mappers"
import { answerQuestion } from "../llm"

export const chatRouter = Router()

chatRouter.use(requireAuth)
// Chat is available to admins and engineers (viewers have read-only graph/risk).
chatRouter.use(requireRole("admin", "engineer"))

// GET /api/chat/sessions — all sessions for the current user, with messages.
chatRouter.get("/sessions", async (req: AuthedRequest, res) => {
  const { orgId, userId } = req.auth!
  const sessions = await query(
    `select * from chat_sessions where org_id = $1 and user_id = $2 order by created_at desc`,
    [orgId, userId],
  )
  const result = []
  for (const s of sessions) {
    const messages = await query(
      `select * from chat_messages where session_id = $1 order by created_at asc`,
      [s.id],
    )
    result.push(mapSession(s, messages))
  }
  res.json(result)
})

// POST /api/chat/sessions — create a new conversation.
chatRouter.post("/sessions", async (req: AuthedRequest, res) => {
  const { orgId, userId } = req.auth!
  const title = (req.body?.title as string) || "New conversation"
  const rows = await query(
    `insert into chat_sessions (org_id, user_id, title) values ($1, $2, $3) returning *`,
    [orgId, userId, title],
  )
  res.json(mapSession(rows[0], []))
})

// DELETE /api/chat/sessions/:id
chatRouter.delete("/sessions/:id", async (req: AuthedRequest, res) => {
  const { orgId, userId } = req.auth!
  await query(
    `delete from chat_sessions where id = $1 and org_id = $2 and user_id = $3`,
    [req.params.id, orgId, userId],
  )
  res.json({ ok: true })
})

// POST /api/chat/sessions/:id/messages — RAG: store user msg, retrieve, generate, store answer.
chatRouter.post("/sessions/:id/messages", async (req: AuthedRequest, res) => {
  const { orgId, userId } = req.auth!
  const sessionId = req.params.id
  const content = (req.body?.content as string)?.trim()
  if (!content) return res.status(400).json({ error: "content is required" })

  const owned = await query(
    `select id, title from chat_sessions where id = $1 and org_id = $2 and user_id = $3`,
    [sessionId, orgId, userId],
  )
  if (!owned[0]) return res.status(404).json({ error: "Session not found" })

  const userRows = await query(
    `insert into chat_messages (session_id, role, content) values ($1, 'user', $2) returning *`,
    [sessionId, content],
  )

  // Name the conversation from its first question.
  if (owned[0].title === "New conversation") {
    await query(`update chat_sessions set title = $2 where id = $1`, [
      sessionId,
      content.slice(0, 60),
    ])
  }

  try {
    const { answer, citations, decisionTrail } = await answerQuestion(orgId, content)
    const assistantRows = await query(
      `insert into chat_messages (session_id, role, content, citations, decision_trail)
       values ($1, 'assistant', $2, $3, $4) returning *`,
      [sessionId, answer, JSON.stringify(citations), JSON.stringify(decisionTrail)],
    )
    res.json({
      userMessage: mapMessage(userRows[0]),
      assistantMessage: mapMessage(assistantRows[0]),
    })
  } catch (err: any) {
    console.error("[v0] chat generation error:", err.message)
    res.status(502).json({
      error: "The assistant could not generate a response.",
      detail: err.message,
      userMessage: mapMessage(userRows[0]),
    })
  }
})
