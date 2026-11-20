import { Reveal } from "@/components/ui/Reveal";

/** Orange plasma sunburst panel with a bold two-line statement. */
export function Statement({ lines, sub }: { lines: [string, string]; sub?: string }) {
  return (
    <section className="panel sunburst grid min-h-[70svh] place-items-center px-5 py-24 md:min-h-[80svh]">
      <div aria-hidden className="sunburst-core absolute left-1/2 top-1/2 aspect-square w-[min(72vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <Reveal className="relative text-center">
        <h2 className="text-[clamp(2.4rem,6vw,4.6rem)] font-bold leading-[0.95] tracking-[-0.05em] text-[#fff6c8] [text-shadow:0_2px_30px_rgb(255_140_0/0.6)]">
          <span className="block">{lines[0]}</span>
          <span className="block">{lines[1]}</span>
        </h2>
        {sub && <p className="mx-auto mt-5 max-w-xl text-base text-[#fff1d6] md:text-lg">{sub}</p>}
      </Reveal>
    </section>
  );
}
