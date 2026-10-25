import { ImageResponse } from "next/og"

import { site } from "@/config/site"
import { FlameMark } from "@/lib/seo/icon-mark"

export const runtime = "nodejs"

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${site.theme.accent}, ${site.theme.accentEnd})`,
          color: "white",
        }}
      >
        <FlameMark size={300} />
      </div>
    ),
    { width: 512, height: 512 }
  )
}
