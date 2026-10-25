"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import { LayoutList, LogOut, Plus } from "lucide-react"
import { toast } from "sonner"

import { useMe } from "@/hooks/use-me"
import { authFetch } from "@/lib/auth/auth-fetch"
import { auth } from "@/firebase/client"
import Logo from "../Logo"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import AuthDialog from "../AuthScreen/AuthDialog"

export function Header() {
    const router = useRouter()
    const queryClient = useQueryClient()

    // undefined = still checking, null = signed out
    const [user, setUser] = useState<User | null | undefined>(undefined)
    useEffect(() => onAuthStateChanged(auth, setUser), [])

    const { data: me } = useMe(!!user)

    async function logout() {
        try {
            const response = await authFetch("/api/session", { method: "DELETE" })
            if (!response.ok) {
                throw new Error(`Session clearing failed with status ${response.status}.`)
            }
            await signOut(auth)
            queryClient.clear() // don't leak this user's messages to the next sign-in
            router.replace("/")
        } catch {
            toast.error("Couldn't log out. Try again.")
        }
    }

    const initial = (me?.username ?? user?.email ?? "?").charAt(0).toUpperCase()

    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <div className="container flex h-16 items-center justify-between p-2">
                <Logo />

                {user === undefined && (
                    <div className="h-10 w-36 animate-pulse rounded-full bg-muted" aria-hidden />
                )}

                {user === null && (
                    <AuthDialog />
                )}

                {user && (
                    <div className="flex items-center gap-2">
                        <Button
                            asChild
                            className="btn-fuse rounded-full px-4 text-primary-foreground"
                        >
                            <Link href="/new">
                                <Plus className="size-4" aria-hidden />
                                Create message
                            </Link>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Account menu"
                                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <Avatar className="size-10">
                                        <AvatarFallback className="font-bold">{initial}</AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <p className="font-semibold">
                                        {me?.username ? `@${me.username}` : "Signed in"}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/">
                                        <LayoutList className="size-4" aria-hidden />
                                        My messages
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={logout}>
                                    <LogOut className="size-4" aria-hidden />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </header>
    )
}