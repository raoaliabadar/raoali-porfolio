import { about, skills, tools } from "@/lib/content";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

/** Inline pill used inside the large story text. */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-1 inline-flex translate-y-[-0.12em] items-center rounded-full border border-white/15 bg-white/10 px-3 py-0.5 align-middle text-[0.55em] font-medium tracking-normal text-white backdrop-blur">
      {children}
    </span>
  );
}

/** Skills & tools, written as a story with inline chips and a logo strip. */
export function Skills() {
  const allTools = tools.flatMap((g) => g.items);
  return (
    <section
      id="skills"
      className="panel bg-[linear-gradient(180deg,#6f7fa8_0%,#2a3452_32%,#0b0e18_62%,#000_100%)] py-24 md:py-32"
    >
      <div className="container-x">
        <Reveal>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-medium tracking-[-0.045em]">My story</h2>
        </Reveal>

        <div className="mt-8 max-w-4xl space-y-8 text-[clamp(1.4rem,2.8vw,2.3rem)] font-normal leading-[1.35] tracking-[-0.03em] text-[#c7d0e6]">
          <Reveal>
            <p>{about.bio}</p>
          </Reveal>

          {skills.map((g) => (
            <Reveal key={g.title}>
              <p>
                <span className="inline-flex items-center gap-2 text-white">
                  <Icon name={g.icon} className="size-[0.8em] text-accent" />
                  {g.title}
                </span>{" "}
                — {g.description.replace(/\.$/, "")}:
                {g.items.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </p>
            </Reveal>
          ))}
        </div>

        {allTools.length > 0 && (
          <Reveal className="mt-16">
            <p className="text-sm text-[#8e9ab8]">Tools I use every day</p>
            <ul className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-6 border-t border-white/10 pt-6">
              {allTools.map((t) => (
                <li key={t.name} className="flex items-center gap-2.5 text-white/75 transition-colors hover:text-white">
                  {t.icon && <BrandIcon name={t.icon} className="size-5" />}
                  <span className="text-sm font-medium tracking-[0.06em] uppercase">{t.name}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  );
}
