"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"

import { Hero } from "@/components/HomeScreen/Hero"
import { MessageList } from "@/components/HomeScreen/MessageList"
import { UserGreeting } from "@/components/HomeScreen/UserGreeting"
import { auth } from "@/firebase/client"

export function HomeContent({ serverSignedIn }: { serverSignedIn: boolean }) {
  const [clientSignedIn, setClientSignedIn] = useState<boolean | null>(null)

  useEffect(
    () => onAuthStateChanged(auth, (user) => setClientSignedIn(Boolean(user))),
    []
  )

  const signedIn = clientSignedIn ?? serverSignedIn

  return signedIn ? (
    <div className="m-2 space-y-6">
      <UserGreeting />
      <MessageList />
    </div>
  ) : (
    <Hero />
  )
}
