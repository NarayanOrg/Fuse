import { Inngest } from "inngest"

const signingKey = process.env.INNGEST_SIGNING_KEY
const eventKey = process.env.INNGEST_EVENT_KEY

export const inngest = new Inngest({
    id: "message-bomb",
    signingKey,
    eventKey,
    isDev: process.env.NODE_ENV !== "production",
})

if (process.env.NODE_ENV === "production" && (!signingKey || !eventKey)) {
    throw new Error("Missing Inngest production credentials.")
}