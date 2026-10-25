"use client"

import { useQuery } from "@tanstack/react-query"

import { authFetch } from "@/lib/auth/auth-fetch"

export type Me = { onboarded: boolean; username: string | null }

/** The signed-in user's profile. Pass enabled=false while signed out. */
export function useMe(enabled = true) {
    return useQuery({
        queryKey: ["me"],
        enabled,
        queryFn: async () => {
            const res = await authFetch("/api/me")
            if (!res.ok) throw new Error("Failed to load profile")
            return (await res.json()) as Me
        },
        staleTime: 5 * 60_000,
    })
}