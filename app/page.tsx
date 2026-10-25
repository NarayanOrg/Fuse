'use client'
import { Hero } from "@/components/HomeScreen/Hero"
import { MessageList } from "@/components/HomeScreen/MessageList"
import { UserGreeting } from "@/components/HomeScreen/UserGreeting"
import { Header } from "@/components/layouts/Header"
import { auth } from "@/firebase/client"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useEffect, useState } from "react"

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        if (u) {
          setUser(u)
        } else {
          setUser(null)
        }
      }),
    []
  )
  return (
    <main>
      <Header />
      {
        user ? (
          <div className="space-y-6 m-2">
            <UserGreeting />
            <MessageList />
          </div>
        )
          :
          (

            <Hero />
          )
      }
    </main>
  )
}
