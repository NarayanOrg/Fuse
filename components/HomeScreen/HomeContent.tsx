"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import dynamic from "next/dynamic"

import { Hero } from "@/components/HomeScreen/Hero"
import { auth } from "@/firebase/client"

const HomeDashboard = dynamic(
  () => import("@/components/HomeScreen/HomeDashboard"),
  {
    loading: () => (
      <div
        className="mx-auto grid w-full max-w-5xl gap-3 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-2"
        aria-hidden
      >
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    ),
  }
)

export function HomeContent({ serverSignedIn }: { serverSignedIn: boolean }) {
  const [clientSignedIn, setClientSignedIn] = useState<boolean | null>(null)

  useEffect(
    () => onAuthStateChanged(auth, (user) => setClientSignedIn(Boolean(user))),
    []
  )

  const signedIn = clientSignedIn ?? serverSignedIn

  return signedIn ? <HomeDashboard /> : <Hero />
}
