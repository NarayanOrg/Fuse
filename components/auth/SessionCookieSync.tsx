"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { toast } from "sonner"

import { auth } from "@/firebase/client"

const RECENT_SIGN_IN_MS = 4 * 60 * 1000

export function SessionCookieSync() {
  const router = useRouter()

  useEffect(() => {
    let initialized = false
    let revision = 0

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const currentRevision = ++revision
      const initialChange = !initialized
      initialized = true

      if (!user) return
      if (
        initialChange &&
        (!user.metadata.lastSignInTime ||
          Date.now() - Date.parse(user.metadata.lastSignInTime) > RECENT_SIGN_IN_MS)
      ) {
        return
      }

      void (async () => {
        const response = await fetch("/api/session", {
          method: "POST",
          headers: { Authorization: `Bearer ${await user.getIdToken()}` },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(`Session synchronization failed with status ${response.status}.`)
        }

        if (currentRevision === revision) router.refresh()
      })().catch((error: unknown) => {
        if (currentRevision !== revision) return
        console.error("session cookie synchronization failed", error)
        toast.error("Couldn't sync your session. Refresh the page and try again.")
      })
    })

    return () => {
      revision += 1
      unsubscribe()
    }
  }, [router])

  return null
}
