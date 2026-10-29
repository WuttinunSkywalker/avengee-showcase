/** Avengee mark as inline SVG for next/og ImageResponse (app icons). */
export function AvengeeMarkOg({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="9" fill="#2f5bea" />
      <path d="M9 23 16 8l7 15h-4.2L16 16.6 13.2 23Z" fill="#ffffff" />
      <circle cx="16" cy="25.5" r="1.8" fill="#ffc53d" />
    </svg>
  )
}
