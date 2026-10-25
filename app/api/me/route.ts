import { NextResponse } from "next/server"

import { adminDb } from "@/firebase/admin"
import { protectUserRequest } from "@/lib/aj"
import { withAuth } from "@/lib/auth/with-auth"

export const GET = withAuth(async (req, { user }) => {
    const blocked = await protectUserRequest(req, user.uid)
    if (blocked) {
        return NextResponse.json(blocked.body, { status: blocked.status })
    }

    const snap = await adminDb.collection("users").doc(user.uid).get()
    const data = snap.data()

    return NextResponse.json({
        onboarded: !!data?.onboarded,
        username: data?.username ?? null,
    })
})