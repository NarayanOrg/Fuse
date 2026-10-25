const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

export const site = {
  name: "Fuse",
  title: "Fuse: send messages that delete themselves",
  tagline: "Say it. Then watch it disappear.",
  description:
    "Fuse lets you send a self-destructing message link. Set a timer up to one hour; the countdown starts when someone opens it and ends with deletion.",
  url: (configuredUrl || "https://fuse-silk.vercel.app").replace(/\/+$/, ""),
  ogImage: {
    width: 1200,
    height: 630,
  },
  theme: {
    light: "#FAF9F7",
    dark: "#28272C",
    accent: "#FF5A1F",
    accentEnd: "#FF4D4D",
  },
  keywords: [
    "self-destructing message",
    "disappearing message link",
    "burn after reading message",
    "private note that deletes itself",
  ],
  twitterSite: "@narayanbona",
} as const

export function absoluteUrl(path: string) {
  return new URL(path.replace(/^\/?/, "/"), site.url).toString()
}
