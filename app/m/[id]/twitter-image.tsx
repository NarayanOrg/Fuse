import {
  createOgResponse,
  getMessagePreview,
  imageContentType,
  imageSize,
  MessageOgCard,
} from "@/lib/seo/og-cards"

export const runtime = "nodejs"
export const alt = "A self-destructing message preview from Fuse."
export const size = imageSize
export const contentType = imageContentType
export const dynamic = "force-dynamic"

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const message = await getMessagePreview(id)
  return createOgResponse(<MessageOgCard message={message} />)
}
