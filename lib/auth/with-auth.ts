import { NextRequest, NextResponse } from "next/server"
import type { DecodedIdToken } from "firebase-admin/auth"

import { adminAuth } from "@/firebase/admin"

type AuthedHandler = (
    req: NextRequest,
    ctx: { user: DecodedIdToken }
) => Promise<Response> | Response

function unauthorized(code = "UNAUTHORIZED") {
    return NextResponse.json(
        { error: "Unauthorized.", code },
        { status: 401, headers: { "Cache-Control": "no-store" } }
    )
}

/** Returns the decoded Firebase ID token, or null if missing or invalid. */
export async function getAuthUser(req: Request): Promise<DecodedIdToken | null> {
    const header = req.headers.get("authorization")
    if (!header?.startsWith("Bearer ")) return null

    try {
        return await adminAuth.verifyIdToken(header.slice(7))
    } catch {
        return null
    }
}

/** Wrap a route handler so it only runs for signed-in users. */
export function withAuth(handler: AuthedHandler) {
    return async (req: NextRequest) => {
        const user = await getAuthUser(req)
        if (!user) {
            return unauthorized("UNAUTHORIZED")
        }
        return handler(req, { user })
    }
}
