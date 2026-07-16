"use client"

const TOKEN_KEY = "sophia_token"

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** Authenticated fetch for same-origin /api calls (Bearer + session cookie). */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  const token = getAuthToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  // Don't force JSON Content-Type for FormData (browser sets multipart boundary)
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData
  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? "same-origin",
  })
}
