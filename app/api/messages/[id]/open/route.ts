import { NextResponse } from "next/server"

import { adminDb } from "@/firebase/admin"
import { protectPublicRequest } from "@/lib/aj"
import { inngest } from "@/lib/inngest/client"

type Opened = { body: string; bombAt: number; firstOpen: boolean }
const ID_RE = /^[A-Za-z0-9_-]{6,40}$/

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const blocked = await protectPublicRequest(req)
    if (blocked) {
        return NextResponse.json(blocked.body, { status: blocked.status, headers: { "Cache-Control": "no-store" } })
    }

    const { id } = await params
    if (!ID_RE.test(id)) {
        return NextResponse.json({ error: "Invalid message ID.", code: "INVALID_ID" }, { status: 400, headers: { "Cache-Control": "no-store" } })
    }

    const ref = adminDb.collection("messages").doc(id)
    const result = await adminDb.runTransaction(async (tx): Promise<Opened | null> => {
        const snap = await tx.get(ref)
        if (!snap.exists) return null

        const m = snap.data()!
        const now = Date.now()

        if (m.status === "bombed" || (m.bombAt && now >= m.bombAt)) return null
        if (m.status === "opened") {
            return { body: m.body, bombAt: m.bombAt, firstOpen: false }
        }

        const bombAt = now + Number(m.durationSec ?? 0) * 1000
        tx.update(ref, { status: "opened", openedAt: now, bombAt })
        return { body: m.body, bombAt, firstOpen: true }
    })

    if (!result) {
        return NextResponse.json({ gone: true }, { status: 410, headers: { "Cache-Control": "no-store" } })
    }

    if (result.firstOpen) {
        try {
            await inngest.send({
                id: `bomb-${id}`,
                name: "message/opened",
                data: { id, bombAt: result.bombAt },
            })
        } catch (error) {
            console.error("Failed to enqueue bomb event", { id, error })
        }
    }

    return NextResponse.json(
        {
            body: result.body,
            bombAt: result.bombAt,
            serverNow: Date.now(),
        },
        { headers: { "Cache-Control": "no-store" } }
    )
}