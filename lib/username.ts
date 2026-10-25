export const USERNAME_RE = /^[a-z0-9_]{3,20}$/

const RESERVED = new Set([
    "admin",
    "api",
    "fuse",
    "support",
    "new",
    "onboarding",
    "dashboard",
    "m",
])

export const normalizeUsername = (value: string) => value.trim().toLowerCase()
export const isReserved = (username: string) => RESERVED.has(username)