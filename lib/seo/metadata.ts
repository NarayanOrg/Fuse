import type { Metadata } from "next"

import { absoluteUrl, site } from "@/config/site"

type MetadataOptions = {
  title: string
  description: string
  pathname?: string
  imagePath?: string
  imageAlt?: string
  noIndex?: boolean
}

const isProduction = process.env.VERCEL_ENV === "production"

export function buildMetadata({
  title,
  description,
  pathname = "/",
  imagePath = "/opengraph-image",
  imageAlt = "Fuse — Say it. Then watch it disappear.",
  noIndex = false,
}: MetadataOptions): Metadata {
  const index = isProduction && !noIndex
  const imageUrl = absoluteUrl(imagePath)
  const url = absoluteUrl(pathname)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_US",
      url,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: site.ogImage.width,
          height: site.ogImage.height,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: site.twitterSite,
      title,
      description,
      images: [{ url: imageUrl, alt: imageAlt }],
    },
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
        "max-image-preview": "large",
      },
    },
  }
}
