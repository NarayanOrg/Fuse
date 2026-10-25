"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Copy, Flame, Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { authFetch } from "@/lib/auth/auth-fetch"
import { Header } from "@/components/layouts/Header"
import Image from "next/image"

const MAX_BODY = 500
const MIN_SECONDS = 10
const MAX_SECONDS = 3600
const PRESETS = [10, 30, 60, 300, 900, 3600]

const toPercent = (s: number) =>
    (Math.log(s / MIN_SECONDS) / Math.log(MAX_SECONDS / MIN_SECONDS)) * 100

function toSeconds(percent: number) {
    const raw = MIN_SECONDS * Math.pow(MAX_SECONDS / MIN_SECONDS, percent / 100)
    const step = raw < 60 ? 5 : raw < 600 ? 15 : 60
    return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(raw / step) * step))
}

const clock = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

function describe(s: number) {
    if (s === 3600) return "1 hour"
    if (s < 60) return `${s} seconds`
    const m = Math.floor(s / 60)
    const rest = s % 60
    const minutes = `${m} minute${m === 1 ? "" : "s"}`
    return rest ? `${minutes} ${rest} seconds` : minutes
}

const presetLabel = (s: number) => (s < 60 ? `${s}s` : s === 3600 ? "1h" : `${s / 60}m`)

export default function NewMessagePage() {
    const router = useRouter()

    const [checking, setChecking] = useState(true)
    const [body, setBody] = useState("")
    const [seconds, setSeconds] = useState(120)
    const [anonymous, setAnonymous] = useState(false)
    const [label, setLabel] = useState("")
    const [pending, setPending] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [createdId, setCreatedId] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        authFetch("/api/me")
            .then((res) => res.json())
            .then((profile) => {
                if (!active) return
                if (!profile.onboarded) router.replace("/onboarding")
                else setChecking(false)
            })
            .catch(() => {
                if (active) setChecking(false)
            })
        return () => {
            active = false
        }
    }, [router])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmedBody = body.trim()

        if (!trimmedBody) {
            setFormError("Write a message before creating a link.")
            return
        }

        setPending(true)
        setFormError(null)

        try {
            const res = await authFetch("/api/messages", {
                method: "POST",
                body: JSON.stringify({ body: trimmedBody, durationSec: seconds, anonymous, label }),
            })
            const data = await res.json().catch(() => ({}))

            if (res.ok) {
                setCreatedId(data.id)
                return
            }

            if (data.code === "NOT_ONBOARDED") {
                router.replace("/onboarding")
                return
            }

            const errorMessage = data.error ?? "Couldn't create the link. Try again."
            setFormError(errorMessage)
            toast.error(errorMessage)
        } catch {
            const errorMessage = "Couldn't create the link. Try again."
            setFormError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setPending(false)
        }
    }

    function reset() {
        setBody("")
        setLabel("")
        setAnonymous(false)
        setSeconds(120)
        setCreatedId(null)
        setFormError(null)
    }

    if (checking) {
        return (
            <main className="flex min-h-dvh items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
            </main>
        )
    }

    if (createdId) {
        const url = `${window.location.origin}/m/${createdId}`

        async function copy() {
            await navigator.clipboard.writeText(url)
            toast.success("Link copied")
        }

        async function share() {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: "Fuse",
                        text: "I sent you a message that deletes itself.",
                        url,
                    })
                } catch {
                    // share sheet dismissed
                }
            } else {
                await copy()
            }
        }

        return (
            <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10 text-center">
                <div className=" mx-auto flex size-14 items-center justify-center rounded-2xl">
                    <Image src="/logo.png" alt="Logo" width={40} height={40} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">Your link is ready</h1>
                    <p className="text-muted-foreground">
                        The {describe(seconds)} fuse starts when they tap Reveal.
                    </p>
                </div>

                <div className="rounded-2xl border bg-card p-4 text-left">
                    <p className="break-all text-sm">{url}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={copy} aria-label="Copy message link" className="btn-fuse h-12 rounded-full text-primary-foreground">
                        <Copy className="size-4" aria-hidden />
                        Copy link
                    </Button>
                    <Button onClick={share} aria-label="Share message link" variant="outline" className="h-12 rounded-full">
                        <Share2 className="size-4" aria-hidden />
                        Share
                    </Button>
                </div>

                <div className="flex justify-center gap-2">
                    <Button asChild variant="ghost" className="rounded-full">
                        <Link href="/">Back to my messages</Link>
                    </Button>
                    <Button variant="ghost" className="rounded-full" onClick={reset}>
                        Write another
                    </Button>
                </div>
            </main>
        )
    }

    return (
        <main className="mx-auto w-full max-w-md px-4">
            <Header />
            <form onSubmit={onSubmit} noValidate className="flex min-h-dvh flex-col">
                <header className="flex items-center gap-3 py-4">
                    <Button asChild variant="ghost" size="icon" className="rounded-full">
                        <Link href="/" aria-label="Back to my messages">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold">New message</h1>
                </header>

                <div className="flex-1 space-y-6 pb-6">
                    <div className="space-y-2">
                        <Label htmlFor="body" className="sr-only">
                            Message
                        </Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => {
                                setBody(e.target.value)
                                if (formError) setFormError(null)
                            }}
                            maxLength={MAX_BODY}
                            placeholder="Type something that won't last..."
                            required
                            aria-invalid={Boolean(formError)}
                            aria-describedby={formError ? "message-form-error" : "message-help"}
                            className="min-h-40 resize-none rounded-2xl p-4 text-base"
                        />
                        <p id="message-help" className="text-right text-xs text-muted-foreground tabular-nums" aria-live="polite">
                            {body.length} / {MAX_BODY}
                        </p>
                        {formError && (
                            <p id="message-form-error" role="alert" aria-live="polite" className="text-sm text-destructive">
                                {formError}
                            </p>
                        )}
                    </div>

                    <section className="space-y-4 rounded-2xl border bg-card p-5">
                        <h2 className="font-semibold">How long should the fuse be?</h2>

                        <div className="text-center">
                            <p className="text-6xl font-extrabold tabular-nums tracking-tight text-primary">
                                {clock(seconds)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {describe(seconds)} after they open it
                            </p>
                        </div>

                        <Slider
                            value={[toPercent(seconds)]}
                            onValueChange={([v]) => setSeconds(toSeconds(v))}
                            min={0}
                            max={100}
                            step={0.5}
                            aria-label="Fuse length"
                        />

                        <div className="grid grid-cols-6 gap-2">
                            {PRESETS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSeconds(s)}
                                    aria-pressed={seconds === s}
                                    className={
                                        "h-9 rounded-full border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                                        (seconds === s
                                            ? "border-transparent bg-primary text-primary-foreground"
                                            : "bg-secondary text-secondary-foreground hover:bg-accent")
                                    }
                                >
                                    {presetLabel(s)}
                                </button>
                            ))}
                        </div>

                        <p className="text-sm text-muted-foreground">
                            The clock starts when they tap Reveal. When it ends, the message is deleted.
                        </p>
                    </section>

                    <section className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-5">
                        <div className="space-y-1">
                            <Label htmlFor="anonymous" className="text-base font-semibold">
                                Send anonymously
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Hides your handle from the recipient.
                            </p>
                        </div>
                        <Switch id="anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
                    </section>

                    <div className="space-y-2">
                        <Label htmlFor="label">Label</Label>
                        <Input
                            id="label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            maxLength={60}
                            placeholder="e.g. Client onboarding secret"
                            className="h-11 rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">Only you can see this.</p>
                    </div>
                </div>

                <div className="sticky bottom-0 -mx-4 bg-background/80 px-4 py-4 backdrop-blur">
                    <Button
                        type="submit"
                        disabled={!body.trim() || pending}
                        aria-label="Create message link"
                        className="btn-fuse h-14 w-full rounded-full text-base font-semibold text-primary-foreground disabled:opacity-50"
                    >
                        {pending ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                        ) : (
                            <Flame className="size-5" aria-hidden />
                        )}
                        {pending ? "Creating" : "Create link"}
                    </Button>
                </div>
            </form>
        </main>
    )
}
