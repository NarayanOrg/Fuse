"use client";

import { Link2, Timer, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import AuthDialog, { CTA_CLASSES } from "../AuthScreen/AuthDialog";

type HeroProps = {
  className?: string;
};

const points = [
  { icon: Link2, label: "Reopens until timer ends" },
  { icon: Timer, label: "Fuse up to 1 hour" },
  { icon: Trash2, label: "Deleted at zero" },
];

export function Hero({ className }: HeroProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden px-4 pb-10 pt-12 text-center sm:pt-20",
        className
      )}
    >
      {/* Ambient glow behind the headline */}
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-80"
      />

      <div className="mx-auto flex max-w-md flex-col items-center sm:max-w-xl">
        <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Say it. Then watch it{" "}
          <span className="fuse-flicker inline-block bg-linear-to-r from-(--fuse-gradient-from) to-(--fuse-gradient-to) bg-clip-text text-transparent">
            disappear.
          </span>
        </h1>

        <p className="mt-5 max-w-sm text-pretty text-base text-muted-foreground sm:text-lg">
          Write a message, set a timer up to an hour, and share the link. The
          clock starts when they open it. At zero, the message is deleted.
        </p>

        <AuthDialog className={CTA_CLASSES} />

        <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {points.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="size-4 text-primary" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}