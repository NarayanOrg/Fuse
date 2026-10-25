"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { Loader2 } from "lucide-react"

import { auth } from "@/firebase/client"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [signedIn, setSignedIn] = useState(false)

    useEffect(
        () =>
            onAuthStateChanged(auth, (user) => {
                if (user) setSignedIn(true)
                else router.replace("/")
            }),
        [router]
    )

    if (!signedIn) {
        return (
            <main className="flex min-h-dvh items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
            </main>
        )
    }

    return <>{children}</>
}