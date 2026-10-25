import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"

import { adminDb } from "@/firebase/admin"
import { protectUserRequest } from "@/lib/aj"
import { withAuth } from "@/lib/auth/with-auth"
import { USERNAME_RE, isReserved, normalizeUsername } from "@/lib/username"

export const POST = withAuth(async (req, { user }) => {
    const blocked = await protectUserRequest(req, user.uid)
    if (blocked) {
        return NextResponse.json(blocked.body, { status: blocked.status })
    }

    const contentLength = Number(req.headers.get("content-length") ?? "0")
    if (contentLength > 64 * 1024) {
        return NextResponse.json(
            { error: "Request body is too large.", code: "PAYLOAD_TOO_LARGE" },
            { status: 413 }
        )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return NextResponse.json(
            { error: "Request body must be a JSON object.", code: "INVALID_JSON" },
            { status: 400 }
        )
    }

    const username = normalizeUsername(String((body as { username?: unknown }).username ?? ""))

    if (!USERNAME_RE.test(username)) {
        return NextResponse.json(
            { error: "Use 3 to 20 letters, numbers or underscores.", code: "INVALID_USERNAME" },
            { status: 400 }
        )
    }
    if (isReserved(username)) {
        return NextResponse.json(
            { error: "That handle is taken.", code: "USERNAME_TAKEN" },
            { status: 409 }
        )
    }

    const userRef = adminDb.collection("users").doc(user.uid)
    const nameRef = adminDb.collection("usernames").doc(username)

    try {
        await adminDb.runTransaction(async (tx) => {
            const [userSnap, nameSnap] = await Promise.all([tx.get(userRef), tx.get(nameRef)])

            if (userSnap.exists && userSnap.data()?.onboarded) {
                throw new Error("ALREADY_ONBOARDED")
            }
            if (nameSnap.exists && nameSnap.data()?.uid !== user.uid) {
                throw new Error("USERNAME_TAKEN")
            }

            tx.set(nameRef, { uid: user.uid, createdAt: FieldValue.serverTimestamp() })
            tx.set(
                userRef,
                {
                    uid: user.uid,
                    email: user.email ?? null,
                    username,
                    onboarded: true,
                    createdAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
            )
        })
    } catch (err) {
        const code = (err as Error).message
        if (code === "USERNAME_TAKEN") {
            return NextResponse.json(
                { error: "That handle is taken.", code },
                { status: 409 }
            )
        }
        if (code === "ALREADY_ONBOARDED") {
            return NextResponse.json(
                { error: "Profile already set up.", code },
                { status: 409 }
            )
        }
        console.error("onboarding failed", err)
        return NextResponse.json({ error: "Something went wrong.", code: "INTERNAL_ERROR" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, username })
})