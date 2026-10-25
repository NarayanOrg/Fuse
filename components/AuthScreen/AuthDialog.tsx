"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FirebaseError } from "firebase/app"
import {
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    getAdditionalUserInfo,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    type User,
} from "firebase/auth"
import { Eye, EyeOff, Flame, Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import { auth } from "@/firebase/client"
import { Button } from "../ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import Image from "next/image"

/* ------------------------------ helpers ------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type AuthResult = { isNewUser: boolean }
type Errors = Partial<Record<"email" | "password" | "confirm" | "form", string>>

export const CTA_CLASSES =
    "btn-fuse mt-8 h-14 w-full max-w-sm rounded-full text-base font-semibold text-primary-foreground transition-transform hover:opacity-95 active:scale-[0.98]"

function authMessage(code?: string) {
    switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Wrong email or password."
        case "auth/email-already-in-use":
            return "An account with this email already exists. Try signing in."
        case "auth/weak-password":
            return "Choose a stronger password (8+ characters)."
        case "auth/too-many-requests":
            return "Too many attempts. Wait a moment and try again."
        case "auth/network-request-failed":
            return "Network error. Check your connection."
        default:
            return "Something went wrong. Please try again."
    }
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
            />
        </svg>
    )
}

/* ------------------------------ small pieces ------------------------------ */

function Field({
    id,
    label,
    error,
    action,
    children,
}: {
    id: string
    label: string
    error?: string
    action?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor={id}>{label}</Label>
                {action}
            </div>
            {children}
            {error && (
                <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    )
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
    const [visible, setVisible] = useState(false)
    return (
        <div className="relative">
            <Input
                {...props}
                type={visible ? "text" : "password"}
                className="h-11 rounded-xl pr-11"
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
            >
                {visible ? (
                    <EyeOff className="size-4" aria-hidden />
                ) : (
                    <Eye className="size-4" aria-hidden />
                )}
            </button>
        </div>
    )
}

function SubmitButton({
    pending,
    idle,
    busy,
}: {
    pending: boolean
    idle: string
    busy: string
}) {
    return (
        <Button
            type="submit"
            disabled={pending}
            className="btn-fuse h-12 w-full rounded-full text-base font-semibold text-primary-foreground"
        >
            {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
                <Flame className="size-4" aria-hidden />
            )}
            {pending ? busy : idle}
        </Button>
    )
}

/* ------------------------------ forms ------------------------------ */

function SignInForm({ onSuccess }: { onSuccess: (r: AuthResult) => void }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errors, setErrors] = useState<Errors>({})
    const [pending, setPending] = useState(false)

    const clear = (key: keyof Errors) =>
        setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }))

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()

        const next: Errors = {}
        if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address."
        if (!password) next.password = "Enter your password."
        setErrors(next)
        if (Object.keys(next).length) return

        setPending(true)
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password)
            onSuccess({ isNewUser: false })
        } catch (err) {
            setErrors({ form: authMessage((err as FirebaseError).code) })
        } finally {
            setPending(false)
        }
    }

    async function onForgot() {
        if (!EMAIL_RE.test(email.trim())) {
            setErrors({ email: "Enter your email first, then tap Forgot password." })
            return
        }
        try {
            await sendPasswordResetEmail(auth, email.trim())
            toast.success("Reset link sent. Check your inbox.")
        } catch (err) {
            toast.error(authMessage((err as FirebaseError).code))
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field id="signin-email" label="Email" error={errors.email}>
                <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        clear("email")
                    }}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "signin-email-error" : undefined}
                    className="h-11 rounded-xl"
                />
            </Field>

            <Field
                id="signin-password"
                label="Password"
                error={errors.password}
                action={
                    <button
                        type="button"
                        onClick={onForgot}
                        className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline focus-visible:outline-none"
                    >
                        Forgot password?
                    </button>
                }
            >
                <PasswordInput
                    id="signin-password"
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value)
                        clear("password")
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "signin-password-error" : undefined}
                />
            </Field>

            {errors.form && (
                <p role="alert" className="text-sm text-destructive">
                    {errors.form}
                </p>
            )}

            <SubmitButton pending={pending} idle="Sign in" busy="Signing in" />
        </form>
    )
}

function SignUpForm({ onSuccess }: { onSuccess: (r: AuthResult) => void }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [errors, setErrors] = useState<Errors>({})
    const [pending, setPending] = useState(false)

    const clear = (key: keyof Errors) =>
        setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }))

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()

        const next: Errors = {}
        if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address."
        if (password.length < 8) next.password = "Use at least 8 characters."
        if (confirm !== password) next.confirm = "Passwords don't match."
        setErrors(next)
        if (Object.keys(next).length) return

        setPending(true)
        try {
            await createUserWithEmailAndPassword(auth, email.trim(), password)
            onSuccess({ isNewUser: true })
        } catch (err) {
            const code = (err as FirebaseError).code
            if (code === "auth/email-already-in-use") {
                setErrors({ email: authMessage(code) })
            } else if (code === "auth/weak-password") {
                setErrors({ password: authMessage(code) })
            } else {
                setErrors({ form: authMessage(code) })
            }
        } finally {
            setPending(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field id="signup-email" label="Email" error={errors.email}>
                <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        clear("email")
                    }}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "signup-email-error" : undefined}
                    className="h-11 rounded-xl"
                />
            </Field>

            <Field id="signup-password" label="Password" error={errors.password}>
                <PasswordInput
                    id="signup-password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value)
                        clear("password")
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "signup-password-error" : undefined}
                />
            </Field>

            <Field id="signup-confirm" label="Confirm password" error={errors.confirm}>
                <PasswordInput
                    id="signup-confirm"
                    autoComplete="new-password"
                    placeholder="Type it again"
                    value={confirm}
                    onChange={(e) => {
                        setConfirm(e.target.value)
                        clear("confirm")
                    }}
                    aria-invalid={!!errors.confirm}
                    aria-describedby={errors.confirm ? "signup-confirm-error" : undefined}
                />
            </Field>

            {errors.form && (
                <p role="alert" className="text-sm text-destructive">
                    {errors.form}
                </p>
            )}

            <SubmitButton pending={pending} idle="Create account" busy="Creating account" />
        </form>
    )
}

/* ------------------------------ dialog ------------------------------ */

export default function AuthDialog({ className }: { className?: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<"signin" | "signup">("signin")
    const [googleBusy, setGoogleBusy] = useState(false)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => onAuthStateChanged(auth, setUser), [])

    function handleOpenChange(next: boolean) {
        setOpen(next)
        if (!next) setMode("signin")
    }

    function handleSuccess({ isNewUser }: AuthResult) {
        setOpen(false)
        setMode("signin")
        router.push(isNewUser ? "/onboarding" : "/new")
    }

    async function signInWithGoogle() {
        setGoogleBusy(true)
        try {
            const res = await signInWithPopup(auth, new GoogleAuthProvider())
            handleSuccess({ isNewUser: !!getAdditionalUserInfo(res)?.isNewUser })
        } catch (err) {
            const code = (err as FirebaseError).code
            // Closing the popup is not an error worth showing.
            if (
                code !== "auth/popup-closed-by-user" &&
                code !== "auth/cancelled-popup-request"
            ) {
                toast.error(authMessage(code))
            }
        } finally {
            setGoogleBusy(false)
        }
    }

    // Already signed in: skip the dialog and go straight to compose.
    if (user) {
        return (
            <Button size="lg" className={className} onClick={() => router.push("/new")}>
                <Send className="btn-fuse size-5" aria-hidden />
                Send a message
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="lg" className={className}>
                    <Send className="btn-fuse size-5" aria-hidden />
                    Send a message
                </Button>
            </DialogTrigger>

            <DialogContent className="gap-0 my-2 max-h-full overflow-auto border bg-card p-6">
                <DialogHeader className="items-center text-center">
                    <div className="mb-2 flex size-14 items-center justify-center rounded-2xl">
                        <Image src="/logo.png" alt="Logo" width={40} height={40} />
                    </div>
                    <DialogTitle className="text-2xl font-extrabold tracking-tight">
                        Welcome to Fuse
                    </DialogTitle>
                    <DialogDescription className="max-w-[18rem] text-pretty">
                        Sign in to send messages that delete themselves, and track what
                        happens to them.
                    </DialogDescription>
                </DialogHeader>

                <Tabs
                    value={mode}
                    onValueChange={(v) => setMode(v as "signin" | "signup")}
                    className="mt-6 gap-4"
                >
                    <TabsList className="grid h-11 w-full grid-cols-2 rounded-full p-1">
                        <TabsTrigger value="signin" className="rounded-full">
                            Sign in
                        </TabsTrigger>
                        <TabsTrigger value="signup" className="rounded-full">
                            Create account
                        </TabsTrigger>
                    </TabsList>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={signInWithGoogle}
                        disabled={googleBusy}
                        className="h-12 w-full rounded-full text-base font-medium"
                    >
                        {googleBusy ? (
                            <Loader2 className="size-5 animate-spin" aria-hidden />
                        ) : (
                            <GoogleIcon />
                        )}
                        Continue with Google
                    </Button>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="h-px flex-1 bg-border" />
                        or use email
                        <span className="h-px flex-1 bg-border" />
                    </div>

                    <TabsContent value="signin">
                        <SignInForm onSuccess={handleSuccess} />
                    </TabsContent>
                    <TabsContent value="signup">
                        <SignUpForm onSuccess={handleSuccess} />
                    </TabsContent>
                </Tabs>

                <p className="mt-5 text-center text-sm text-muted-foreground">
                    {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                        className="font-medium text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                        {mode === "signin" ? "Create one" : "Sign in"}
                    </button>
                </p>
            </DialogContent>
        </Dialog>
    )
}