import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/m/"],
      disallow: ["/api/", "/new", "/onboarding"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
