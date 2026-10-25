"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { authFetch } from "@/lib/auth/auth-fetch"

type Me = { onboarded: boolean; username: string | null }

export function UserGreeting() {
    const { data, isPending } = useQuery({
        queryKey: ["me"],
        queryFn: async () => {
            const res = await authFetch("/api/me")
            if (!res.ok) throw new Error("Failed to load profile")
            return (await res.json()) as Me
        },
        staleTime: 5 * 60_000,
    })

    if (isPending) {
        return (
            <div className="flex items-center gap-3" aria-hidden>
                <div className="size-12 animate-pulse rounded-full bg-muted" />
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            </div>
        )
    }

    const username = data?.username
    const initial = (username ?? "?").charAt(0).toUpperCase()

    return (
        <div className="flex items-center gap-3">
            <Avatar className="size-12 ring-2 ring-primary/60 ring-offset-2 ring-offset-background">
                <AvatarFallback className="font-bold">{initial}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                    {username ? `Hey, @${username}` : "Hey there"}
                </h1>
                {data && !data.onboarded && (
                    <Link
                        href="/onboarding"
                        className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                        Finish setting up your profile
                    </Link>
                )}
            </div>
        </div>
    )
}