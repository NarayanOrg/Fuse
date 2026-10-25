/** 80 -> "01:20", 3600 -> "60:00" */
export const clock = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

/** 120 -> "2 minutes", 90 -> "1 minute 30 seconds", 3600 -> "1 hour" */
export function describeDuration(s: number) {
    if (s === 3600) return "1 hour"
    if (s < 60) return `${s} seconds`
    const m = Math.floor(s / 60)
    const rest = s % 60
    const minutes = `${m} minute${m === 1 ? "" : "s"}`
    return rest ? `${minutes} ${rest} seconds` : minutes
}