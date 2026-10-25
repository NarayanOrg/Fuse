"use client"

import { MessageList } from "@/components/HomeScreen/MessageList"
import { UserGreeting } from "@/components/HomeScreen/UserGreeting"

export default function HomeDashboard() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
      <UserGreeting />
      <MessageList />
    </div>
  )
}
