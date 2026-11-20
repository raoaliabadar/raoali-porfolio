import { Fragment } from "react";

/** Renders text where *wrapped words* become italic accent serif. */
export function RichText({ text, emClassName = "text-accent" }: { text: string; emClassName?: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <em key={i} className={`italic ${emClassName}`}>
            {part.slice(1, -1)}
          </em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
