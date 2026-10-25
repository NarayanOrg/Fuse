import { cache } from "react"
import type { Metadata } from "next"
import { FieldPath } from "firebase-admin/firestore"

import { Reader } from "@/components/reader/reader"
import { adminDb } from "@/firebase/admin"
import { describeDuration } from "@/lib/format-duration"
import { buildMetadata } from "@/lib/seo/metadata"

// Public page: no sign-in. Always read fresh from Firestore.
export const dynamic = "force-dynamic"

const ID_RE = /^[A-Za-z0-9_-]{6,40}$/

// Shared by generateMetadata and the page so it's one read per request.
// Reading here never opens the message, so link-preview bots are harmless.
const getInfo = cache(async (id: string) => {
    if (!ID_RE.test(id)) return null

    const snap = await adminDb
        .collection("messages")
        .where(FieldPath.documentId(), "==", id)
        .select("senderUsername", "anonymous", "durationSec", "status", "bombAt")
        .limit(1)
        .get()
    const document = snap.docs[0]
    if (!document) return null

    const m = document.data()
    const bombed =
        m.status === "bombed" || (m.status === "opened" && !!m.bombAt && Date.now() >= m.bombAt)

    return {
        sender:
            m.anonymous === true || typeof m.senderUsername !== "string"
                ? null
                : m.senderUsername.slice(0, 20),
        durationSec: m.durationSec as number,
        bombed,
    }
})

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>
}): Promise<Metadata> {
    const { id } = await params
    const info = await getInfo(id)

    const live = info && !info.bombed
    const title = live ? "A message that deletes itself" : "Message gone"
    const description = live
        ? `${info.sender ? `@${info.sender} sent you a message.` : "Someone sent you a message."} It disappears ${describeDuration(info.durationSec)} after you open it.`
        : "This message no longer exists."

    return buildMetadata({
        title,
        description,
        pathname: `/m/${encodeURIComponent(id)}`,
        imagePath: `/m/${encodeURIComponent(id)}/opengraph-image`,
        imageAlt: "A private Fuse message link. The message itself is never shown in this preview.",
        noIndex: true,
    })
}

export default async function MessagePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const info = await getInfo(id)

    return (
        <Reader
            id={id}
            sender={info?.sender ?? null}
            durationSec={info?.durationSec ?? 0}
            state={!info ? "missing" : info.bombed ? "bombed" : "ready"}
        />
    )
}