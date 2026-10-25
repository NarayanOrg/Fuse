import type { NextConfig } from "next"

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com https://apis.google.com; " +
      "script-src-elem 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com https://apis.google.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob: https://*.googleusercontent.com https://firebasestorage.googleapis.com; " +
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://accounts.google.com https://apis.google.com; " +
      "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none'; " +
      "upgrade-insecure-requests",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/m/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ]
  },
}

export default nextConfig
