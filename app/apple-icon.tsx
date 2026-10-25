import { ImageResponse } from "next/og"

import { site } from "@/config/site"
import { FlameMark } from "@/lib/seo/icon-mark"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 42,
          background: `linear-gradient(135deg, ${site.theme.accent}, ${site.theme.accentEnd})`,
          color: "white",
        }}
      >
        <FlameMark size={116} />
      </div>
    ),
    size
  )
}
