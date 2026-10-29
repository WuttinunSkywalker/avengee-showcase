import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** Sorn Studio's roof-and-ground mark in concrete on drafting ink, matching icon.svg. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1f1c" }}>
        <svg width="130" height="130" viewBox="0 0 32 32" fill="none" stroke="#eef0ec" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M5 15 16 7l11 8" />
          <path d="M9 13v11h14V13" />
          <path d="M4 25h24" />
          <path d="M14 25v-6h4v6" />
        </svg>
      </div>
    ),
    size,
  )
}
