import {
  createOgResponse,
  DefaultOgCard,
  imageContentType,
  imageSize,
} from "@/lib/seo/og-cards"

export const alt = "Fuse — Say it. Then watch it disappear."
export const size = imageSize
export const contentType = imageContentType
export const runtime = "nodejs"

export default function OpenGraphImage() {
  return createOgResponse(<DefaultOgCard />)
}
