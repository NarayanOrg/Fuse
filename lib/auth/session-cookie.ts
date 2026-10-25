import { cookies } from "next/headers"

import { adminAuth } from "@/firebase/admin"

export const SESSION_COOKIE_NAME = "__session"

const INVALID_SESSION_CODES = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/invalid-id-token",
  "auth/session-cookie-expired",
  "auth/session-cookie-revoked",
])

export async function hasValidSessionCookie() {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return false

  try {
    await adminAuth.verifySessionCookie(sessionCookie)
    return true
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined

    if (typeof code === "string" && INVALID_SESSION_CODES.has(code)) {
      return false
    }

    throw error
  }
}
