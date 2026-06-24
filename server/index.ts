import express from "express"
import cors from "cors"
import { authRouter } from "./routes/auth"
import { orgRouter } from "./routes/org"
import { membersRouter } from "./routes/members"
import { connectorsRouter } from "./routes/connectors"
import { graphRouter } from "./routes/graph"
import { riskRouter } from "./routes/risk"
import { chatRouter } from "./routes/chat"

const app = express()
const PORT = Number(process.env.API_PORT || 4000)

app.use(cors())
app.use(express.json({ limit: "1mb" }))

app.get("/api/health", (_req, res) => res.json({ ok: true }))

app.use("/api/auth", authRouter)
app.use("/api/org", orgRouter)
app.use("/api/members", membersRouter)
app.use("/api/connectors", connectorsRouter)
app.use("/api/graph", graphRouter)
app.use("/api/risk", riskRouter)
app.use("/api/chat", chatRouter)

// Fallback error handler.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[v0] unhandled error:", err?.message)
  res.status(500).json({ error: "Internal server error" })
})

app.listen(PORT, () => {
  console.log(`[v0] API server listening on http://localhost:${PORT}`)
})
