import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { NextResponse } from "next/server"
import type { UserRole } from "@sophia/shared"

const SALT_ROUNDS = 12
const TOKEN_EXPIRY = "7d"
const TOKEN_MAX_AGE_SEC = 60 * 60 * 24 * 7

export const AUTH_COOKIE_NAME = "sophia_token"

export interface AuthTokenPayload {
  sub: string
  email: string
  role: UserRole
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_MAX_AGE_SEC,
  }
}

export function applyAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions())
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE_NAME, "", { ...authCookieOptions(), maxAge: 0 })
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters")
  }
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function isBcryptHash(password: string): boolean {
  return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$")
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(password, stored)
  }
  return password === stored
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJwtSecret())
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    }
  } catch {
    return null
  }
}

export function stripPassword<T extends { password?: string }>(user: T): Omit<T, "password"> {
  const { password: _, ...rest } = user
  return rest as Omit<T, "password">
}
