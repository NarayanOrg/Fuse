import { ProtectedRoute } from "@/hooks/ProtectedRoute"
import { buildMetadata } from "@/lib/seo/metadata"

export const metadata = buildMetadata({
    title: "Create a message",
    description: "Write a private message, choose when it disappears, and share its link.",
    pathname: "/new",
    noIndex: true,
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    )
}
