import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** Klin's flacon with its brass cap and monsoon juice, matching icon.svg. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1b282d" }}>
        <svg width="130" height="130" viewBox="0 0 32 32">
          <rect x="13" y="5" width="6" height="5" rx="0.6" fill="#c9a46a" />
          <path d="M14 10h4v2.5c3.2.8 5.5 2.6 5.5 5.5v8.5a1.5 1.5 0 0 1-1.5 1.5H10a1.5 1.5 0 0 1-1.5-1.5V18c0-2.9 2.3-4.7 5.5-5.5Z" fill="none" stroke="#f1ebdf" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M10.2 19.5h11.6v6.3a.7.7 0 0 1-.7.7H10.9a.7.7 0 0 1-.7-.7Z" fill="#9fb8a8" />
        </svg>
      </div>
    ),
    size,
  )
}
