import { FieldValue } from "firebase-admin/firestore"

import { adminDb } from "@/firebase/admin"
import { inngest } from "./client"

export const bombMessage = inngest.createFunction(
    { id: "bomb-message", triggers: { event: "message/opened" } },
    async ({ event, step }) => {
        const { id, bombAt } = event.data as { id: string; bombAt: number }

        await step.sleepUntil("wait-for-fuse", new Date(bombAt))

        await step.run("detonate", () =>
            adminDb.collection("messages").doc(id).update({
                status: "bombed",
                body: FieldValue.delete(),
                bombedAt: Date.now(),
            })
        )
    }
)

// export const sweepExpiredMessages = inngest.createFunction(
//     { id: "sweep-expired-messages", triggers: { cron: "*/5 * * * *" } },
//     async ({ step }) => {
//         await step.run("purge-expired-messages", async () => {
//             const now = Date.now()
//             const snap = await adminDb
//                 .collection("messages")
//                 .where("status", "==", "opened")
//                 .where("bombAt", ">", 0)
//                 .get()

//             const expiredIds = snap.docs
//                 .filter((doc) => {
//                     const data = doc.data()
//                     return typeof data.bombAt === "number" && data.bombAt <= now
//                 })
//                 .map((doc) => doc.id)

//             await Promise.all(
//                 expiredIds.map((id) =>
//                     adminDb.collection("messages").doc(id).update({
//                         status: "bombed",
//                         body: FieldValue.delete(),
//                         bombedAt: now,
//                     })
//                 )
//             )

//             return { deleted: expiredIds.length }
//         })
//     }
// )

export const functions = [bombMessage]