import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

const petals = [0, 72, 144, 216, 288]

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1d2b53" }}>
        <svg width="140" height="140" viewBox="-16 -16 32 32">
          {petals.map((angle) => (
            <ellipse key={angle} rx="3.2" ry="7" cy="-6" fill="#f3f6f1" transform={`rotate(${angle})`} />
          ))}
          <circle r="2.6" fill="#e0a526" />
        </svg>
      </div>
    ),
    size,
  )
}
