"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { answer } from "@/lib/ask";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { sectionNumber } from "@/lib/sections";
import { ask, identity, sections } from "@/src/content";

const TITLE = sections.find((s) => s.id === "ask")!.title;
type Line = { who: "q" | "a"; text: string };

/**
 * [08] Ask: a terminal-style card. Questions are answered only from src/content.ts (see
 * lib/ask.ts); anything else gets "Please contact Ali directly". Answers type themselves out.
 */
export function Ask() {
  const n = sectionNumber("ask");
  const [log, setLog] = useState<Line[]>([{ who: "a", text: `Ask about ${identity.shortName}'s work. Answers come only from this site's content.` }]);
  const [typing, setTyping] = useState(false);
  const [value, setValue] = useState("");
  const screen = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight, behavior: "smooth" });
  }, [log, typing]);

  const send = (q: string) => {
    const question = q.trim();
    if (!question || typing) return;
    setValue("");
    const reply = answer(question);
    setLog((l) => [...l, { who: "q", text: question }]);
    if (prefersReducedMotion()) {
      setLog((l) => [...l, { who: "a", text: reply }]);
      return;
    }
    setTyping(true);
    setupGsap();
    const o = { n: 0 };
    // Type the answer into a live span, then commit it to the log.
    requestAnimationFrame(() => {
      gsap.to(o, {
        n: reply.length,
        duration: Math.min(2.4, 0.4 + reply.length / 160),
        ease: "none",
        onUpdate: () => {
          if (live.current) live.current.textContent = reply.slice(0, Math.round(o.n));
        },
        onComplete: () => {
          setTyping(false);
          setLog((l) => [...l, { who: "a", text: reply }]);
        },
      });
    });
  };

  return (
    <Section id="ask" labelledBy="ask-title">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHead n={n} label="Ask" id="ask-title" title={TITLE} />
          <p className="mt-8 max-w-[26rem] text-[1rem] leading-relaxed text-ink/75">
            A quick way to look things up. It only knows what is written on this site; for anything else it will point you to {identity.shortName}.
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[6px] border border-ink bg-ink text-paper">
            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-paper/15 px-4 py-2.5">
              <span className="flex gap-1.5" aria-hidden>
                <span className="size-2 rounded-full bg-paper/25" />
                <span className="size-2 rounded-full bg-paper/25" />
                <span className="size-2 rounded-full bg-signal" />
              </span>
              <span className="font-mono text-[0.7rem] tracking-[0.04em] text-paper/60">ali@ledger:~/ask</span>
              <span className="font-mono text-[0.7rem] text-paper/40">content.ts</span>
            </div>

            {/* Screen */}
            <div ref={screen} className="h-[22rem] space-y-4 overflow-y-auto px-4 py-5 font-mono text-[0.84rem] leading-relaxed sm:px-6" aria-live="polite">
              {log.map((l, i) => (
                <p key={i} className={l.who === "q" ? "text-paper" : "text-paper/75"}>
                  <span className={l.who === "q" ? "text-[#8db39e]" : "text-paper/35"}>{l.who === "q" ? "> " : "  "}</span>
                  {l.text}
                </p>
              ))}
              {typing && (
                <p className="text-paper/75">
                  <span className="text-paper/35">{"  "}</span>
                  <span ref={live} />
                  <span className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-[#8db39e]" />
                </p>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(value);
              }}
              className="flex items-center gap-3 border-t border-paper/15 px-4 py-3 sm:px-6"
            >
              <label htmlFor="ask-input" className="font-mono text-[0.84rem] text-[#8db39e]">
                &gt;
              </label>
              <input
                id="ask-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Type a question…"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent font-mono text-[0.84rem] text-paper placeholder:text-paper/35 focus:outline-none"
              />
              <button type="submit" disabled={typing || !value.trim()} className="label rounded-[4px] border border-paper/25 px-3 py-2 text-paper transition-colors hover:border-paper disabled:opacity-40">
                Ask
              </button>
            </form>
          </div>

          {/* Suggested questions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {ask.chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => send(c)}
                disabled={typing}
                className="label rounded-[4px] border border-ink/20 px-3 py-2 text-[0.66rem] text-ink transition-colors hover:border-signal hover:text-signal disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
