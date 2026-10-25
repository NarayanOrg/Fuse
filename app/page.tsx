import { Header } from "@/components/layouts/Header"
import { HowItWorks } from "@/components/HomeScreen/HowItWorks"
import { HomeContent } from "@/components/HomeScreen/HomeContent"
import { absoluteUrl, site } from "@/config/site"
import { hasValidSessionCookie } from "@/lib/auth/session-cookie"

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: site.name,
  url: absoluteUrl("/"),
  description: site.description,
  applicationCategory: "CommunicationApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
}

export default async function Home() {
  const signedIn = await hasValidSessionCookie()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <main>
        <Header />
        <HomeContent serverSignedIn={signedIn} />
      </main>
    </>
  )
}
