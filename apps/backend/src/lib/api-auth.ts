import { NextResponse } from "next/server"
import type { UserRole } from "@sophia/shared"
import { AUTH_COOKIE_NAME, verifyAuthToken, type AuthTokenPayload } from "@/lib/auth"
import { db } from "@/lib/db"

export type AuthSession = AuthTokenPayload

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  return header.slice(7).trim() || null
}

function getCookieToken(req: Request): string | null {
  const cookie = req.headers.get("cookie")
  if (!cookie) return null
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`))
  if (!match?.[1]) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

/** Bearer (mobile/web) or httpOnly session cookie (web pages). */
export function getRequestToken(req: Request): string | null {
  return getBearerToken(req) ?? getCookieToken(req)
}

export async function getSession(req: Request): Promise<AuthSession | null> {
  const token = getRequestToken(req)
  if (!token) return null

  const payload = await verifyAuthToken(token)
  if (!payload) return null

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, status: true },
  })

  if (!user || user.status !== "ACTIVE") return null

  // Prefer live DB role/email over stale JWT claims
  return {
    sub: user.id,
    email: user.email,
    role: user.role as UserRole,
  }
}

export async function requireAuth(req: Request): Promise<AuthSession | NextResponse> {
  const session = await getSession(req)
  if (!session) {
    return new NextResponse("Não autorizado", { status: 401 })
  }
  return session
}

export async function requireRole(
  req: Request,
  roles: UserRole[]
): Promise<AuthSession | NextResponse> {
  const session = await requireAuth(req)
  if (session instanceof NextResponse) return session
  if (!roles.includes(session.role)) {
    return new NextResponse("Acesso negado", { status: 403 })
  }
  return session
}

export function assertSelfOrAdmin(session: AuthSession, targetUserId: string): NextResponse | null {
  if (session.sub !== targetUserId && session.role !== "ADMIN") {
    return new NextResponse("Acesso negado", { status: 403 })
  }
  return null
}

/** Admins may act on another user via query/body; everyone else is always themselves. */
export function resolveUserId(
  session: AuthSession,
  requestedUserId?: string | null
): string {
  if (session.role === "ADMIN" && requestedUserId) {
    return requestedUserId
  }
  return session.sub
}

export function isUnauthorized(
  session: AuthSession | NextResponse
): session is NextResponse {
  return session instanceof NextResponse
}
