import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** A coffee bean on cherry red, matching icon.svg. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#b3202a" }}>
        <svg width="130" height="130" viewBox="0 0 32 32">
          <g transform="rotate(30 16 16)">
            <ellipse cx="16" cy="16" rx="7.5" ry="10" fill="#ffffff" />
            <path d="M12.5 9.5c3.5 3 3.2 10-0.5 13.5" stroke="#b3202a" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    ),
    size,
  )
}
