import { NextResponse } from "next/server"

import { adminDb } from "@/firebase/admin"
import { protectUserRequest } from "@/lib/aj"
import { withAuth } from "@/lib/auth/with-auth"
import { USERNAME_RE, isReserved, normalizeUsername } from "@/lib/username"

export const GET = withAuth(async (req, { user }) => {
    const blocked = await protectUserRequest(req, user.uid)
    if (blocked) {
        return NextResponse.json(blocked.body, { status: blocked.status })
    }

    const username = normalizeUsername(new URL(req.url).searchParams.get("u") ?? "")

    if (!USERNAME_RE.test(username)) {
        return NextResponse.json({ available: false, reason: "invalid" })
    }
    if (isReserved(username)) {
        return NextResponse.json({ available: false, reason: "taken" })
    }

    const snap = await adminDb.collection("usernames").doc(username).get()
    const available = !snap.exists || snap.data()?.uid === user.uid

    return NextResponse.json({ available, reason: available ? null : "taken" })
})