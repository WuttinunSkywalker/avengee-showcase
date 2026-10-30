import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** Talad's gilt dealer tag on lacquer black, matching icon.svg. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1f1b16" }}>
        <svg width="130" height="130" viewBox="0 0 32 32">
          <path d="M16 5 24 12v15H8V12Z" fill="#d8b45a" />
          <circle cx="16" cy="12" r="2.2" fill="#1f1b16" />
        </svg>
      </div>
    ),
    size,
  )
}
