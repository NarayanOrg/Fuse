import { Flame } from "lucide-react"

import { clock } from "@/lib/format-duration"
import { cn } from "@/lib/utils"

type Props = {
    remainingMs: number
    totalMs: number
    className?: string
}

const SIZE = 224
const STROKE = 10
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function CountdownDial({ remainingMs, totalMs, className }: Props) {
    const progress = Math.max(0, Math.min(1, remainingMs / totalMs))
    const seconds = Math.ceil(remainingMs / 1000)
    const urgent = seconds <= 10

    return (
        <div className={cn("flex flex-col items-center gap-6", className)}>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-primary">
                <Flame className="size-3.5" aria-hidden />
                Fuse burning · {clock(Math.round(totalMs / 1000))} window
            </span>

            <div
                role="timer"
                aria-label={`${seconds} seconds remaining`}
                className="relative"
                style={{ width: SIZE, height: SIZE }}
            >
                <svg
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    className="size-full -rotate-90"
                    style={{ filter: "drop-shadow(0 0 14px var(--fuse-glow))" }}
                    aria-hidden
                >
                    <defs>
                        <linearGradient id="dial-gradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" style={{ stopColor: "var(--fuse-gradient-from)" }} />
                            <stop offset="1" style={{ stopColor: "var(--fuse-gradient-to)" }} />
                        </linearGradient>
                    </defs>
                    <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        strokeWidth={STROKE}
                        className="stroke-muted"
                    />
                    <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                        stroke={urgent ? undefined : "url(#dial-gradient)"}
                        className={cn(
                            "transition-[stroke-dashoffset] duration-300 ease-linear",
                            urgent && "stroke-destructive"
                        )}
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className={cn(
                            "text-5xl font-extrabold tabular-nums tracking-tight",
                            urgent && "text-destructive motion-safe:animate-pulse"
                        )}
                    >
                        {clock(seconds)}
                    </span>
                    <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                        Remaining
                    </span>
                </div>
            </div>
        </div>
    )
}