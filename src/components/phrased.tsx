import { Fragment } from "react"
import { cn } from "@/lib/utils"

/**
 * Thai has no spaces between words, so browsers may break a heading in the
 * middle of a phrase ("บ้านไม้ | สัก"). Copy uses spaces between phrases;
 * this keeps each phrase together and prefers to break at those spaces
 * (a phrase still wraps internally if it alone is wider than the line).
 * `phraseClassName` + `offset` stagger an animation phrase by phrase via `--i`.
 */
export function Phrased({ text, phraseClassName, offset = 0 }: { text: string; phraseClassName?: string; offset?: number }) {
  const phrases = text.split(" ")
  return (
    <>
      {phrases.map((phrase, index) => (
        <Fragment key={index}>
          <span className={cn("inline-block max-w-full", phraseClassName)} style={phraseClassName ? ({ "--i": offset + index } as React.CSSProperties) : undefined}>
            {phrase}
          </span>
          {index < phrases.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  )
}
