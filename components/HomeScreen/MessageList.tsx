"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Bomb, Copy, Flame, Hourglass, Lock, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authFetch } from "@/lib/auth/auth-fetch"
import { cn } from "@/lib/utils"

type Status = "pending" | "opened" | "bombed"
type Filter = "all" | Status

type MessageItem = {
    id: string
    label: string | null
    status: Status
    durationSec: number
    createdAt: number | null
    openedAt: number | null
    bombAt: number | null
    bombedAt: number | null
}

/* ------------------------------ helpers ------------------------------ */

// Ticks every second, but only while something is counting down.
function useNow(active: boolean) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
        if (!active) return
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [active])
    return now
}

// If the fuse has run out, show "bombed" even before the server catches up.
function statusOf(m: MessageItem, now: number): Status {
    if (m.status === "opened" && m.bombAt && now >= m.bombAt) return "bombed"
    return m.status
}

function ago(ms: number | null, now: number) {
    if (!ms) return "recently"
    const s = Math.max(0, Math.floor((now - ms) / 1000))
    if (s < 60) return "just now"
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
}

function fuseLabel(s: number) {
    if (s === 3600) return "1 hr"
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    return s % 60 ? `${m}m ${s % 60}s` : `${m} min`
}

const clock = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

/* ------------------------------ pieces ------------------------------ */

const STATUS_UI = {
    pending: { label: "Pending", icon: Hourglass, className: "bg-pending/15 text-pending" },
    opened: { label: "Opened", icon: Flame, className: "bg-warning/15 text-warning" },
    bombed: { label: "Bombed", icon: Bomb, className: "bg-bombed-surface text-bombed" },
} as const

function StatusBadge({ status }: { status: Status }) {
    const { label, icon: Icon, className } = STATUS_UI[status]
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                className
            )}
        >
            <Icon className="size-3.5" aria-hidden />
            {label}
        </span>
    )
}

function CountdownRing({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
    const radius = 22
    const circumference = 2 * Math.PI * radius
    const progress = Math.max(0, Math.min(1, remainingMs / totalMs))
    const seconds = Math.ceil(remainingMs / 1000)

    return (
        <div
            className="relative size-14 shrink-0"
            role="timer"
            aria-label={`${seconds} seconds left`}
        >
            <svg viewBox="0 0 56 56" className="size-full -rotate-90" aria-hidden>
                <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="4" className="stroke-muted" />
                <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    className={cn(
                        "transition-[stroke-dashoffset] duration-1000 ease-linear",
                        seconds <= 10 ? "stroke-destructive" : "stroke-warning"
                    )}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">
                {clock(seconds)}
            </span>
        </div>
    )
}

function MessageCard({ m, status, now }: { m: MessageItem; status: Status; now: number }) {
    const title = m.label || "Untitled message"

    async function copyLink() {
        await navigator.clipboard.writeText(`${window.location.origin}/m/${m.id}`)
        toast.success("Link copied")
    }

    const sub =
        status === "pending"
            ? `Not opened yet · created ${ago(m.createdAt, now)}`
            : status === "opened"
                ? `Recipient opened ${ago(m.openedAt, now)}`
                : `Bombed ${ago(m.bombedAt ?? m.bombAt, now)}`

    return (
        <li
            className={cn(
                "rounded-2xl border bg-card p-4",
                status === "opened" && "border-warning/40",
                status === "bombed" && "opacity-60"
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <StatusBadge status={status} />
                <span className="text-xs text-muted-foreground">{fuseLabel(m.durationSec)} fuse</span>
            </div>

            <div className="mt-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{sub}</p>
                </div>
                {status === "opened" && m.bombAt && (
                    <CountdownRing
                        remainingMs={Math.max(0, m.bombAt - now)}
                        totalMs={m.durationSec * 1000}
                    />
                )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <div
                    aria-hidden
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-muted/60 px-3 py-2"
                >
                    <Lock className="size-4 shrink-0 text-muted-foreground" />
                    {status === "bombed" ? (
                        <span className="text-xs text-muted-foreground">Message deleted</span>
                    ) : (
                        <span className="h-3 w-2/3 rounded bg-muted-foreground/30 blur-[3px]" />
                    )}
                </div>
                {status === "pending" && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full"
                        onClick={copyLink}
                    >
                        <Copy className="size-4" aria-hidden />
                        Copy link
                    </Button>
                )}
            </div>
        </li>
    )
}

/* ------------------------------ list ------------------------------ */

export function MessageList() {
    const [filter, setFilter] = useState<Filter>("all")

    const { data, isPending, isError, refetch } = useQuery({
        queryKey: ["messages"],
        queryFn: async () => {
            const res = await authFetch("/api/messages")
            if (!res.ok) throw new Error("Failed to load messages")
            const json = await res.json()
            return json.messages as MessageItem[]
        },
        refetchInterval: 10_000, // picks up opens from recipients
    })

    const messages = data ?? []
    const now = useNow(messages.some((m) => m.status === "opened"))

    const items = messages.map((m) => ({ m, status: statusOf(m, now) }))
    const count = (s: Status) => items.filter((i) => i.status === s).length
    const visible = filter === "all" ? items : items.filter((i) => i.status === filter)

    const tabs: { value: Filter; label: string; n: number }[] = [
        { value: "all", label: "All", n: items.length },
        { value: "pending", label: "Pending", n: count("pending") },
        { value: "opened", label: "Opened", n: count("opened") },
        { value: "bombed", label: "Bombed", n: count("bombed") },
    ]

    if (isPending) {
        return (
            <div className="space-y-3" aria-hidden>
                {[0, 1, 2].map((i) => (
                    <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
                ))}
            </div>
        )
    }

    if (isError) {
        return (
            <div className="space-y-3 rounded-2xl border p-8 text-center">
                <p className="text-muted-foreground">Couldn&apos;t load your messages.</p>
                <Button onClick={() => refetch()} className="rounded-full">
                    Try again
                </Button>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="space-y-4 rounded-2xl border border-dashed p-10 text-center">
                <Flame className="mx-auto size-10 text-muted-foreground" aria-hidden />
                <div>
                    <p className="font-semibold">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Write one and send the link.</p>
                </div>
                <Button asChild className="btn-fuse rounded-full text-primary-foreground">
                    <Link href="/new">Write your first one</Link>
                </Button>
            </div>
        )
    }

    return (
        <section className="space-y-4">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                <TabsList className="grid h-11 w-full grid-cols-4 rounded-full p-1">
                    {tabs.map((t) => (
                        <TabsTrigger key={t.value} value={t.value} className="rounded-full text-xs sm:text-sm">
                            {t.label}
                            <span className="ml-1 text-muted-foreground tabular-nums">{t.n}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {visible.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    Nothing here yet.
                </p>
            ) : (
                <ul className="space-y-3">
                    {visible.map(({ m, status }) => (
                        <MessageCard key={m.id} m={m} status={status} now={now} />
                    ))}
                </ul>
            )}

            {/* Stays inside the column instead of the far corner of wide screens */}
            <div className="pointer-events-none sticky bottom-6 flex justify-end">
                <Button
                    asChild
                    size="icon"
                    className="btn-fuse pointer-events-auto size-14 rounded-full text-primary-foreground shadow-lg"
                >
                    <Link href="/new" aria-label="New message">
                        <Plus className="size-6" />
                    </Link>
                </Button>
            </div>
        </section>
    )
}