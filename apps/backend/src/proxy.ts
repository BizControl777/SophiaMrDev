import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth"

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
}

const ROLE_SEGMENTS = new Set(["student", "teacher", "admin"])

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: CORS_HEADERS,
      })
    }
    return withCors(NextResponse.next())
  }

  const segment = pathname.split("/")[1]?.toLowerCase()
  if (!segment || !ROLE_SEGMENTS.has(segment)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    const login = new URL("/login", request.url)
    login.searchParams.set("next", pathname)
    return NextResponse.redirect(login)
  }

  const payload = await verifyAuthToken(token)
  if (!payload) {
    const login = new URL("/login", request.url)
    const res = NextResponse.redirect(login)
    res.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    })
    return res
  }

  const rolePath = payload.role.toLowerCase()
  if (rolePath !== segment) {
    return NextResponse.redirect(new URL(`/${rolePath}/dashboard`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/admin/:path*",
  ],
}
