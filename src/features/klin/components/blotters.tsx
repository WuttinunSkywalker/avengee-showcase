import { scents } from "../data/scents"

/** Where the strips hang from, and how far each fans out. */
const PIVOT = { x: 150, y: 12 }
const FAN = [-16, -2, 12]

/**
 * Three perfumer's blotter strips hanging in a fan, one per scent, each tip
 * soaked in that scent's colour with the darker tide line a drop leaves on
 * paper. They swing open as the atelier comes into view (a `klin-rise`); only
 * a picture.
 */
export function Blotters({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 268" aria-hidden="true" className={className}>
      <defs>
        <filter id="blotter-shadow" x="-30%" y="-10%" width="160%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#221a15" floodOpacity="0.18" />
        </filter>
        {scents.map((scent) => (
          <linearGradient key={scent.id} id={`blotter-${scent.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.52" stopColor={scent.liquid} stopOpacity="0" />
            <stop offset="0.6" stopColor={scent.liquid} stopOpacity="0.75" />
            <stop offset="0.63" stopColor={scent.liquid} stopOpacity="0.5" />
            <stop offset="1" stopColor={scent.liquid} stopOpacity="0.85" />
          </linearGradient>
        ))}
      </defs>
      {scents.map((scent, index) => (
        <g
          key={scent.id}
          className="klin-blotter"
          style={{ "--fan": `${FAN[index]}deg`, "--i": index, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` } as React.CSSProperties}
        >
          <g transform={`translate(${PIVOT.x} ${PIVOT.y})`} filter="url(#blotter-shadow)">
            <path d="M -15 0 H 15 V 212 L 0 244 L -15 212 Z" fill="#fbfaf6" />
            <path d="M -15 0 H 15 V 212 L 0 244 L -15 212 Z" fill={`url(#blotter-${scent.id})`} />
            <text x="0" y="22" textAnchor="middle" className="font-heading" fontSize="8" letterSpacing="1.5" fill="#221a15" opacity="0.7">
              KLIN
            </text>
          </g>
        </g>
      ))}
      <circle cx={PIVOT.x} cy={PIVOT.y} r="3.5" fill="#221a15" opacity="0.65" />
    </svg>
  )
}
