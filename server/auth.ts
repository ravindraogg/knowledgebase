import crypto from "node:crypto"
import type { Request, Response, NextFunction } from "express"
import { query } from "./db"

const SECRET = process.env.AUTH_SECRET || process.env.POSTGRES_URL || "dev-insecure-secret"

// ---- Password hashing (scrypt, no external deps) ----
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const derived = crypto.scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false
  const [salt, key] = stored.split(":")
  if (!salt || !key) return false
  const derived = crypto.scryptSync(password, salt, 64).toString("hex")
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(derived, "hex"))
}

// ---- Stateless HMAC-signed tokens ----
export interface TokenPayload {
  userId: string
  orgId: string
  memberId: string
  role: "admin" | "engineer" | "viewer"
}

export function signToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifyToken(token: string | undefined): TokenPayload | null {
  if (!token) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url")
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload
  } catch {
    return null
  }
}

// ---- Express middleware ----
export interface AuthedRequest extends Request {
  auth?: TokenPayload
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  req.auth = payload
  next()
}

export function requireRole(...roles: TokenPayload["role"][]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Forbidden" })
    }
    next()
  }
}

/** Touch member last_active without blocking the request. */
export function touchMember(memberId: string) {
  query(`update organization_members set last_active = now() where id = $1`, [memberId]).catch(
    () => {},
  )
}
