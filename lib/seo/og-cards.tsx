import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"
import type { ReactElement } from "react"
import "server-only"
import { FieldPath } from "firebase-admin/firestore"

import { site } from "@/config/site"
import { describeDuration } from "@/lib/format-duration"
import { adminDb } from "@/firebase/admin"
import { FlameMark } from "./icon-mark"

export const imageSize = { width: 1200, height: 630 }
export const imageContentType = "image/png"
export const imageCacheHeaders = {
  "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
}

const outfitRegular = readFile(join(process.cwd(), "assets", "fonts", "Outfit-Regular.ttf"))
const outfitBold = readFile(join(process.cwd(), "assets", "fonts", "Outfit-Bold.ttf"))
const MESSAGE_ID_RE = /^[A-Za-z0-9_-]{6,40}$/

export type MessagePreview = {
  sender: string | null
  durationSec: number
  bombed: boolean
}

export async function getMessagePreview(id: string): Promise<MessagePreview | null> {
  if (!MESSAGE_ID_RE.test(id)) return null

  const snapshot = await adminDb
    .collection("messages")
    .where(FieldPath.documentId(), "==", id)
    .select("senderUsername", "anonymous", "durationSec", "status", "bombAt")
    .limit(1)
    .get()

  const document = snapshot.docs[0]
  if (!document) return null

  const message = document.data()
  const bombed =
    message.status === "bombed" ||
    (message.status === "opened" &&
      typeof message.bombAt === "number" &&
      Date.now() >= message.bombAt)

  return {
    sender:
      message.anonymous === true || typeof message.senderUsername !== "string"
        ? null
        : message.senderUsername.slice(0, 20),
    durationSec:
      typeof message.durationSec === "number" && Number.isFinite(message.durationSec)
        ? message.durationSec
        : 0,
    bombed,
  }
}

function FlameIcon({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <path
        d="M280 42c18 84-63 111-63 192 0 34 11 63 30 82-2-57 56-82 60-139 48 48 91 98 91 163 0 82-64 146-142 146S114 422 114 340c0-89 57-140 111-205 5 46 21 69 38 90-4-71 29-112 17-183Z"
        fill="#FF6A2A"
      />
      <path
        d="M256 282c26 28 42 53 42 86a42 42 0 1 1-84 0c0-34 17-59 42-86Z"
        fill="#28272C"
      />
    </svg>
  )
}

function CountdownRing({ size = 150 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" fill="none">
      <circle cx="75" cy="75" r="62" stroke="#4D4140" strokeWidth="9" />
      <path
        d="M75 13a62 62 0 0 1 60.2 76.7"
        stroke="#FF5A1F"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="75" cy="75" r="45" stroke="#FFFFFF" strokeOpacity=".08" />
      <path d="M75 48v29l19 12" stroke="#F7F4F1" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <FlameIcon size={38} />
      <span style={{ color: "#F7F4F1", fontSize: 34, fontWeight: 700 }}>Fuse</span>
    </div>
  )
}

export function DefaultOgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "58px 72px",
        color: "#F7F4F1",
        background: "linear-gradient(125deg, #28272C 0%, #1B191D 100%)",
        fontFamily: "Outfit",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 470,
          height: 470,
          right: -105,
          top: -155,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,90,31,.28) 0%, rgba(255,77,77,.04) 68%, transparent 72%)",
        }}
      />
      <Brand />
      <div
        style={{
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "space-between",
          flex: 1,
          paddingTop: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 790 }}>
          <div style={{ fontSize: 64, lineHeight: 1.08, fontWeight: 700 }}>
            Say it. Then watch it
          </div>
          <div
            style={{
              fontSize: 78,
              lineHeight: 1.05,
              fontWeight: 700,
              backgroundImage: `linear-gradient(90deg, ${site.theme.accent}, ${site.theme.accentEnd})`,
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            disappear.
          </div>
          <div style={{ marginTop: 20, fontSize: 25, color: "#C9C5C3" }}>
            A disappearing message link with a timer you choose.
          </div>
        </div>
        <div style={{ display: "flex", marginRight: 8 }}>
          <CountdownRing size={142} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#A9A4A3", fontSize: 20 }}>
        <span>Messages that disappear after the timer ends</span>
        <span>{new URL(site.url).host}</span>
      </div>
    </div>
  )
}

export function MessageOgCard({ message }: { message: MessagePreview | null }) {
  const isBombed = message?.bombed
  const sender = message?.sender
    ? `@${message.sender.length > 18 ? `${message.sender.slice(0, 16)}…` : message.sender}`
    : "Someone"
  const headline = message ? "sent you a message" : "A message, with a timer"

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        flexDirection: "column",
        color: "#F7F4F1",
        background: "linear-gradient(125deg, #28272C 0%, #1B191D 100%)",
        fontFamily: "Outfit",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 430,
          height: 430,
          right: -125,
          top: -180,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,90,31,.22) 0%, rgba(255,77,77,.03) 68%, transparent 72%)",
        }}
      />
      <div style={{ display: "flex", position: "absolute", left: 68, top: 48 }}>
        <Brand />
      </div>
      {isBombed ? (
        <div
          style={{
            position: "absolute",
            left: 68,
            right: 68,
            top: 242,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 68, lineHeight: 1.1, fontWeight: 700 }}>Message destroyed</div>
          <div style={{ color: "#C9C5C3", fontSize: 27 }}>This message no longer exists.</div>
        </div>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              left: 80,
              right: 80,
              top: 188,
              display: "flex",
              justifyContent: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
              fontSize: 56,
              lineHeight: 1.12,
              fontWeight: 700,
            }}
          >
            {message ? sender : headline}
          </div>
          {message && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 80,
                  right: 80,
                  top: 256,
                  display: "flex",
                  justifyContent: "center",
                  textAlign: "center",
                  fontSize: 48,
                  lineHeight: 1.1,
                  fontWeight: 700,
                }}
              >
                {headline}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 100,
                  right: 100,
                  top: 350,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: "14px 20px",
                  borderRadius: 999,
                  border: "1px solid #4D4140",
                  background: "#302D31",
                  color: "#E7E0DC",
                  fontSize: 25,
                  whiteSpace: "nowrap",
                }}
              >
                <FlameMark size={25} />
                <span>
                  Self-destructs {describeDuration(message.durationSec)} after you open it
                </span>
              </div>
            </>
          )}
          <div
            style={{
              position: "absolute",
              top: message ? 442 : 350,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <CountdownRing size={66} />
            <span style={{ color: "#FF8756", fontSize: 24, fontWeight: 700 }}>Tap to reveal</span>
          </div>
        </>
      )}
      <div
        style={{
          position: "absolute",
          right: 68,
          bottom: 48,
          display: "flex",
          justifyContent: "flex-end",
          color: "#A9A4A3",
          fontSize: 20,
        }}
      >
        {new URL(site.url).host}
      </div>
    </div>
  )
}

export async function createOgResponse(element: ReactElement) {
  return new ImageResponse(element, {
    ...imageSize,
    fonts: [
      {
        name: "Outfit",
        data: await outfitRegular,
        style: "normal",
        weight: 400,
      },
      {
        name: "Outfit",
        data: await outfitBold,
        style: "normal",
        weight: 700,
      },
    ],
    headers: imageCacheHeaders,
  })
}
