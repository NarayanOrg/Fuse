import type { Metadata } from "next"

import { buildMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildMetadata({
  title: "Set up your profile",
  description: "Choose your Fuse handle to start sending disappearing messages.",
  pathname: "/onboarding",
  noIndex: true,
})

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
