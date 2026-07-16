import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"

const TOKEN_KEY = "sophia_token"
const USER_ID_KEY = "sophia_user_id"

const DEFAULT_HOST =
  Platform.OS === "web" ? "http://localhost:3000" : "http://172.28.60.245:3000"

export const API_URL = `${process.env.EXPO_PUBLIC_API_URL || DEFAULT_HOST}/api`

let authToken: string | null = null
export let CURRENT_USER_ID = ""

async function storageSet(key: string, value: string) {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key)
    return null
  }
  return SecureStore.getItemAsync(key)
}

async function storageDelete(key: string) {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}

export async function setAuthToken(token: string | null) {
  authToken = token
  if (token) await storageSet(TOKEN_KEY, token)
  else await storageDelete(TOKEN_KEY)
}

export const getAuthToken = () => authToken

export async function setUserId(id: string) {
  CURRENT_USER_ID = id
  if (id) await storageSet(USER_ID_KEY, id)
  else await storageDelete(USER_ID_KEY)
}

/** Load token/userId from secure storage into memory. Call once on app start. */
export async function hydrateAuth(): Promise<boolean> {
  const [token, userId] = await Promise.all([
    storageGet(TOKEN_KEY),
    storageGet(USER_ID_KEY),
  ])
  authToken = token
  CURRENT_USER_ID = userId || ""
  return Boolean(token)
}

export async function clearAuth() {
  authToken = null
  CURRENT_USER_ID = ""
  await Promise.all([storageDelete(TOKEN_KEY), storageDelete(USER_ID_KEY)])
}

async function request(method: string, endpoint: string, data?: unknown) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Network response was not ok")
  }

  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const api = {
  get: (endpoint: string) => request("GET", endpoint),
  post: (endpoint: string, data?: unknown) => request("POST", endpoint, data),
  patch: (endpoint: string, data: unknown) => request("PATCH", endpoint, data),
}

export async function loginRequest(email: string, password: string) {
  const result = await request("POST", "/auth/login", { email, password })
  if (result.token) await setAuthToken(result.token)
  if (result.user?.id) await setUserId(result.user.id)
  return result
}

export async function registerRequest(payload: Record<string, unknown>) {
  const result = await request("POST", "/auth/register", payload)
  if (result.token) await setAuthToken(result.token)
  if (result.user?.id) await setUserId(result.user.id)
  return result
}
