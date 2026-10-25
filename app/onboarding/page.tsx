"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { AlertTriangle, Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth } from "@/firebase/client"
import { authFetch } from "@/lib/auth/auth-fetch"
import { USERNAME_RE } from "@/lib/username"
import { ProtectedRoute } from "@/hooks/ProtectedRoute"

type Status = "idle" | "checking" | "available" | "taken" | "invalid"

export default function OnboardingPage() {
    const router = useRouter()

    const [user, setUser] = useState<User | null>(null)
    const [ready, setReady] = useState(false)
    const [username, setUsername] = useState("")
    const [status, setStatus] = useState<Status>("idle")
    const [pending, setPending] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const usernameStatus: Status = !username
        ? "idle"
        : !USERNAME_RE.test(username)
            ? "invalid"
            : status

    useEffect(
        () =>
            onAuthStateChanged(auth, (u) => {
                if (!u) {
                    router.replace("/")
                    return
                }
                setUser(u)
                setReady(true)
            }),
        [router]
    )

    useEffect(() => {
        if (!username || !USERNAME_RE.test(username)) return

        const ctrl = new AbortController()
        const timer = setTimeout(async () => {
            try {
                const res = await authFetch(`/api/username?u=${username}`, {
                    signal: ctrl.signal,
                })
                const data = await res.json()
                setStatus(data.available ? "available" : "taken")
                setSubmitError(null)
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    setStatus("idle")
                    setSubmitError("Unable to check that handle right now. Please try again.")
                }
            }
        }, 400)

        return () => {
            clearTimeout(timer)
            ctrl.abort()
        }
    }, [username])

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!user || usernameStatus !== "available") {
            setSubmitError("Choose an available handle to continue.")
            return
        }

        setPending(true)
        setSubmitError(null)

        try {
            const res = await authFetch("/api/onboarding", {
                method: "POST",
                body: JSON.stringify({ username }),
            })
            const data = await res.json().catch(() => ({}))

            if (res.ok || data.code === "ALREADY_ONBOARDED") {
                router.replace("/new")
                return
            }

            if (data.code === "USERNAME_TAKEN") {
                setStatus("taken")
                setSubmitError("That handle is taken. Please choose another one.")
                return
            }

            setSubmitError(data.error ?? "Something went wrong. Please try again.")
            toast.error(data.error ?? "Something went wrong. Please try again.")
        } catch {
            setSubmitError("Something went wrong. Please try again.")
            toast.error("Something went wrong. Please try again.")
        } finally {
            setPending(false)
        }
    }

    if (!ready) {
        return (
            <main className="flex min-h-dvh items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
            </main>
        )
    }

    return (
        <ProtectedRoute>
            <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-10">
                <form onSubmit={onSubmit} className="space-y-8" noValidate>
                    <header className="space-y-2 text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight">Set up your profile</h1>
                        <p className="text-muted-foreground">
                            Pick your handle before someone else claims it.
                        </p>
                    </header>

                    <div className="space-y-2">
                        <Label htmlFor="username">Choose handle</Label>
                        <div className="relative">
                            <span
                                aria-hidden
                                className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted-foreground"
                            >
                                @
                            </span>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => {
                                    const nextUsername = e.target.value
                                        .toLowerCase()
                                        .replace(/\s/g, "")
                                        .replace(/^@/, "")
                                    setUsername(nextUsername)
                                    setStatus(USERNAME_RE.test(nextUsername) ? "checking" : "idle")
                                    setSubmitError(null)
                                }}
                                maxLength={20}
                                autoComplete="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                placeholder="yourname"
                                required
                                aria-invalid={usernameStatus === "taken" || usernameStatus === "invalid"}
                                aria-describedby="username-hint"
                                className="h-12 rounded-xl pl-8"
                            />
                        </div>

                        <div id="username-hint" role="status" aria-live="polite" className="min-h-5 text-sm">
                            {usernameStatus === "checking" && (
                                <p className="flex items-center gap-1.5 text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin" aria-hidden />
                                    Checking…
                                </p>
                            )}
                            {usernameStatus === "available" && (
                                <p className="flex items-center gap-1.5 text-primary">
                                    <Check className="size-4" aria-hidden />@{username} is available
                                </p>
                            )}
                            {usernameStatus === "taken" && (
                                <p className="flex items-center gap-1.5 text-destructive">
                                    <X className="size-4" aria-hidden />
                                    That handle is taken
                                </p>
                            )}
                            {usernameStatus === "invalid" && (
                                <p className="flex items-center gap-1.5 text-warning">
                                    <AlertTriangle className="size-4" aria-hidden />
                                    Handle must be at least 3 characters
                                </p>
                            )}
                        </div>

                        {submitError && (
                            <p id="form-error" role="alert" className="text-sm text-destructive">
                                {submitError}
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                            3 to 20 characters: letters, numbers, underscores.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        disabled={usernameStatus !== "available" || pending}
                        aria-label="Continue with selected handle"
                        className="btn-fuse h-14 w-full rounded-full text-base font-semibold text-primary-foreground disabled:opacity-50"
                    >
                        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                        {pending ? "Saving" : "Continue"}
                    </Button>
                </form>
            </main>
        </ProtectedRoute>
    )
}
