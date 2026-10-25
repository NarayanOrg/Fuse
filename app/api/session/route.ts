import { NextResponse } from "next/server"

import { adminAuth } from "@/firebase/admin"
import { protectUserRequest } from "@/lib/aj"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie"
import { withAuth } from "@/lib/auth/with-auth"

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000
const cookieOptions = {
  httpOnly: true,
  maxAge: SESSION_DURATION_MS / 1000,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
}

export const POST = withAuth(async (request, { user }) => {
  const blocked = await protectUserRequest(request, user.uid)
  if (blocked) {
    return NextResponse.json(blocked.body, { status: blocked.status })
  }

  const authorization = request.headers.get("authorization")
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : ""
  if (!idToken) {
    return NextResponse.json(
      { error: "A Firebase ID token is required.", code: "UNAUTHORIZED" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    )
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  })

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  )
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, cookieOptions)
  return response
})

export const DELETE = withAuth(async (request, { user }) => {
  const blocked = await protectUserRequest(request, user.uid)
  if (blocked) {
    return NextResponse.json(blocked.body, { status: blocked.status })
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  )
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 })
  return response
})
