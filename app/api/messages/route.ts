import { randomBytes } from "node:crypto"

import { NextResponse } from "next/server"
import { FieldValue } from "firebase-admin/firestore"

import { adminDb } from "@/firebase/admin"
import { protectUserRequest } from "@/lib/aj"
import { withAuth } from "@/lib/auth/with-auth"

const MAX_BODY = 500
const MAX_LABEL = 60
const MIN_SECONDS = 10
const MAX_SECONDS = 3600

export const POST = withAuth(async (req, { user }) => {
    const blocked = await protectUserRequest(req, user.uid)
    if (blocked) {
        return NextResponse.json(blocked.body, { status: blocked.status })
    }

    const profileSnap = await adminDb.collection("users").doc(user.uid).get()
    const profile = profileSnap.data()
    if (!profile?.onboarded) {
        return NextResponse.json(
            { error: "Finish setting up your profile first.", code: "NOT_ONBOARDED" },
            { status: 403 }
        )
    }

    const contentLength = Number(req.headers.get("content-length") ?? "0")
    if (contentLength > 64 * 1024) {
        return NextResponse.json(
            { error: "Request body is too large.", code: "PAYLOAD_TOO_LARGE" },
            { status: 413 }
        )
    }

    const input = await req.json().catch(() => null)
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return NextResponse.json(
            { error: "Request body must be a JSON object.", code: "INVALID_JSON" },
            { status: 400 }
        )
    }

    const body = typeof input.body === "string" ? input.body.trim() : ""
    const durationSec = Number((input as { durationSec?: unknown }).durationSec)
    const anonymous = (input as { anonymous?: unknown }).anonymous === true
    const label =
        typeof (input as { label?: unknown }).label === "string"
            ? String((input as { label?: string }).label).trim().slice(0, MAX_LABEL)
            : ""

    if (!body || body.length > MAX_BODY) {
        return NextResponse.json(
            { error: `Message must be 1 to ${MAX_BODY} characters.`, code: "INVALID_BODY" },
            { status: 400 }
        )
    }
    if (!Number.isInteger(durationSec) || durationSec < MIN_SECONDS || durationSec > MAX_SECONDS) {
        return NextResponse.json(
            { error: "Timer must be between 10 seconds and 1 hour.", code: "INVALID_DURATION" },
            { status: 400 }
        )
    }

    const id = randomBytes(9).toString("base64url")

    await adminDb.collection("messages").doc(id).create({
        ownerUid: user.uid,
        senderUsername: anonymous ? null : (profile.username ?? null),
        anonymous,
        label: label || null,
        body,
        durationSec,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        openedAt: null,
        bombAt: null,
        bombedAt: null,
    })

    return NextResponse.json({ id }, { status: 201 })
})

export const GET = withAuth(async (req, { user }) => {
    const blocked = await protectUserRequest(req, user.uid)
    if (blocked) {
        return NextResponse.json(blocked.body, { status: blocked.status })
    }

    const snap = await adminDb.collection("messages").where("ownerUid", "==", user.uid).get()

    const messages = snap.docs
        .map((doc) => {
            const m = doc.data()
            return {
                id: doc.id,
                label: (m.label as string | null) ?? null,
                status: m.status as "pending" | "opened" | "bombed",
                durationSec: m.durationSec as number,
                createdAt: (m.createdAt?.toMillis?.() as number | undefined) ?? null,
                openedAt: (m.openedAt as number | null) ?? null,
                bombAt: (m.bombAt as number | null) ?? null,
                bombedAt: (m.bombedAt as number | null) ?? null,
            }
        })
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))

    return NextResponse.json({ messages })
})