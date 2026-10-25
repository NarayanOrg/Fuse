import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter, Roboto } from "next/font/google"

import "./globals.css"
import { absoluteUrl, site } from "@/config/site"
import { ThemeProvider } from "@/components/theme-provider"
import QueryProvider from "@/hooks/QueryProvider"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"

const robotoHeading = Roboto({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

const isProduction = process.env.VERCEL_ENV === "production"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s | Fuse",
  },
  description: site.description,
  applicationName: site.name,
  category: "communication",
  keywords: [...site.keywords],
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    url: absoluteUrl("/"),
    title: site.title,
    description: site.description,
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: site.ogImage.width,
        height: site.ogImage.height,
        alt: "Fuse — Say it. Then watch it disappear.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: site.twitterSite,
    title: site.title,
    description: site.description,
    images: [
      {
        url: absoluteUrl("/twitter-image"),
        alt: "Fuse — Say it. Then watch it disappear.",
      },
    ],
  },
  robots: {
    index: isProduction,
    follow: isProduction,
    googleBot: {
      index: isProduction,
      follow: isProduction,
      "max-image-preview": "large",
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: site.theme.light },
    { media: "(prefers-color-scheme: dark)", color: site.theme.dark },
  ],
  colorScheme: "dark light",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, robotoHeading.variable)}
    >
      <QueryProvider>
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <Toaster position="top-center" closeButton />
        </body>
      </QueryProvider>
    </html>
  )
}
