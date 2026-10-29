import { Fragment } from "react"

/**
 * Thai has no spaces between words, so browsers may break a heading in the
 * middle of a phrase ("บ้านไม้ | สัก"). Copy uses spaces between phrases;
 * this keeps each phrase together and prefers to break at those spaces
 * (a phrase still wraps internally if it alone is wider than the line).
 */
export function Phrased({ text }: { text: string }) {
  const phrases = text.split(" ")
  return (
    <>
      {phrases.map((phrase, index) => (
        <Fragment key={index}>
          <span className="inline-block max-w-full">{phrase}</span>
          {index < phrases.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  )
}
