import { auth } from "@/firebase/client"

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const user = auth.currentUser
    if (!user) throw new Error("Not signed in")

    const token = await user.getIdToken()
    if (!token) throw new Error("Not signed in")

    const headers = new Headers(init.headers)
    headers.set("Authorization", `Bearer ${token}`)
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
    }

    return fetch(input, {
        ...init,
        headers,
        cache: "no-store",
    })
}
