"use client"

import { Link2, Timer, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import AuthDialog, { CTA_CLASSES } from "../AuthScreen/AuthDialog"

type HeroProps = {
  className?: string
}

const points = [
  { icon: Link2, label: "Reopens until timer ends" },
  { icon: Timer, label: "Fuse up to 1 hour" },
  { icon: Trash2, label: "Deleted at zero" },
]

export function Hero({ className }: HeroProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden px-4 pt-10 pb-12 text-center sm:px-6 sm:pt-20 sm:pb-16",
        className
      )}
    >
      {/* Ambient glow behind the headline */}
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-80"
      />

      <div className="mx-auto flex max-w-xl flex-col items-center sm:max-w-3xl">
        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          Say it. Then watch it{" "}
          <span className="fuse-flicker inline-block bg-linear-to-r from-(--fuse-gradient-from) to-(--fuse-gradient-to) bg-clip-text text-transparent">
            disappear.
          </span>
        </h1>

        <p className="mt-5 max-w-lg text-base text-pretty text-muted-foreground sm:text-lg">
          Write a message, set a timer up to an hour, and share the link. The
          clock starts when they open it. At zero, the message is deleted.
        </p>

        <AuthDialog className={CTA_CLASSES} />

        <ul className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-3 text-sm text-muted-foreground sm:gap-x-6">
          {points.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="size-4 text-primary" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
