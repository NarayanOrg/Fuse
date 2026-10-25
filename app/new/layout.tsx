import { ProtectedRoute } from "@/hooks/ProtectedRoute"


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
