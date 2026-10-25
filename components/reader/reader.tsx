"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Flame, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { describeDuration } from "@/lib/format-duration"
import { CountdownDial } from "./countdown-dial"

type Phase = "ready" | "opening" | "revealed" | "bombed" | "missing"

type Props = {
    id: string
    /** Sender's handle, or null when sent anonymously */
    sender: string | null
    durationSec: number
    /** Where the server found the message when the page loaded */
    state: "ready" | "bombed" | "missing"
}

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-6 px-4 py-8 text-center sm:gap-8 sm:px-6 sm:py-10">
            {children}
        </main>
    )
}

function Footer() {
    return (
        <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
            Send your own with Fuse
        </Link>
    )
}

export function Reader({ id, sender, durationSec, state }: Props) {
    const [phase, setPhase] = useState<Phase>(state)
    const [error, setError] = useState<string | null>(null)
    const [body, setBody] = useState<string | null>(null)
    const [bombAt, setBombAt] = useState<number | null>(null)
    const [remainingMs, setRemainingMs] = useState(durationSec * 1000)
    const clockOffset = useRef(0) // server time minus device time

    async function reveal() {
        setError(null)
        setPhase("opening")
        try {
            const res = await fetch(`/api/messages/${id}/open`, {
                method: "POST",
            })

            if (res.status === 410) {
                setPhase("bombed")
                return
            }
            if (!res.ok) throw new Error("open failed")

            const data = await res.json()
            clockOffset.current = data.serverNow - Date.now()
            setBody(data.body)
            setBombAt(data.bombAt)
            setRemainingMs(Math.max(0, data.bombAt - data.serverNow))
            setPhase("revealed")
        } catch {
            setError("Couldn't open the message. Try again.")
            setPhase("ready")
        }
    }

    // Count down against the server's deadline; wipe the text at zero.
    useEffect(() => {
        if (phase !== "revealed" || !bombAt) return

        const tick = () => {
            const left = bombAt - (Date.now() + clockOffset.current)
            if (left <= 0) {
                setBody(null)
                setPhase("bombed")
                return true
            }
            setRemainingMs(left)
            return false
        }

        if (tick()) return
        const timer = setInterval(() => {
            if (tick()) clearInterval(timer)
        }, 250)
        return () => clearInterval(timer)
    }, [phase, bombAt])

    /* ------------------------- gone / invalid ------------------------- */
    if (phase === "bombed" || phase === "missing") {
        const isBombed = phase === "bombed"
        return (
            <Shell>
                <div
                    className="text-6xl motion-safe:animate-in motion-safe:duration-500 motion-safe:zoom-in-50 sm:text-7xl"
                    aria-hidden
                >
                    {isBombed ? "💥" : "🫥"}
                </div>
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
                        {isBombed ? "Message destroyed" : "Nothing here"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isBombed
                            ? "This message no longer exists."
                            : "This link doesn't exist, or the message is already gone."}
                    </p>
                </div>
                <Button
                    asChild
                    className="btn-fuse h-12 rounded-full px-8 text-primary-foreground"
                >
                    <Link href="/">Send your own message</Link>
                </Button>
            </Shell>
        )
    }

    /* ----------------------------- revealed ----------------------------- */
    if (phase === "revealed") {
        return (
            <Shell>
                <CountdownDial
                    remainingMs={remainingMs}
                    totalMs={durationSec * 1000}
                />

                <div className="w-full rounded-2xl border bg-card p-4 text-left sm:p-6">
                    <p className="text-base wrap-break-word whitespace-pre-wrap sm:text-lg">
                        {body}
                    </p>
                </div>

                <p className="text-sm text-muted-foreground">
                    This message will be deleted when the timer ends.
                </p>
            </Shell>
        )
    }

    /* --------------------------- before reveal --------------------------- */
    return (
        <Shell>
            <div className="btn-fuse flex size-16 items-center justify-center rounded-3xl text-primary-foreground sm:size-20">
                <Flame className="size-8 sm:size-10" aria-hidden />
            </div>

            <div className="flex flex-col gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
                    {sender
                        ? `@${sender} sent you a message`
                        : "Someone sent you a message"}
                </h1>
                <p className="mx-auto inline-block rounded-full border bg-card px-4 py-1.5 text-sm">
                    Self-destructs {describeDuration(durationSec)} after you
                    open it
                </p>
            </div>

            <div className="flex w-full max-w-sm flex-col gap-3">
                <Button
                    onClick={reveal}
                    disabled={phase === "opening"}
                    className="btn-fuse h-14 w-full rounded-full text-base font-semibold text-primary-foreground"
                >
                    {phase === "opening" && (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                    )}
                    {phase === "opening" ? "Opening" : "Reveal message"}
                </Button>
                <p className="text-sm text-muted-foreground">
                    Once you tap, the clock starts and can&apos;t be paused.
                </p>
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
            </div>

            <Footer />
        </Shell>
    )
}
