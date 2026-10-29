import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** Krua Yai's steaming bowl in cream on banana-leaf green, matching icon.svg. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1f7a3a" }}>
        <svg width="130" height="130" viewBox="0 0 32 32" fill="none" stroke="#fff4d1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 16h22a11 8 0 0 1-22 0Z" />
          <path d="M12 26.5h8" />
          <path d="M12 12c-1-1.5 1-2.5 0-4" />
          <path d="M16 12c-1-1.5 1-2.5 0-4" />
          <path d="M20 12c-1-1.5 1-2.5 0-4" />
        </svg>
      </div>
    ),
    size,
  )
}
