import Image from "next/image";
import { MapPin } from "lucide-react";
import { about, site } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { LocalClock } from "@/components/ui/LocalClock";
import { CountUp } from "@/components/ui/CountUp";

export function About() {
  return (
    <section id="about" className="container-x py-24 md:py-36">
      <SectionHeading index="01" label="About" title={about.heading} />

      <div className="grid gap-4 md:grid-cols-12">
        {/* Portrait */}
        <Reveal className="md:col-span-5 md:row-span-2 lg:col-span-4">
          <SpotlightCard className="group relative h-full min-h-[22rem] overflow-hidden">
            {about.portrait ? (
              <Image
                src={about.portrait}
                alt={`Portrait of ${site.name}`}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 42vw, 100vw"
                className="object-cover grayscale transition duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgb(232_165_75/0.35),transparent_60%),radial-gradient(circle_at_80%_90%,rgb(122_59_18/0.5),transparent_55%)]">
                <span className="font-serif text-[9rem] italic leading-none text-fg/90 transition-transform duration-700 group-hover:scale-105">
                  {site.initials.toLowerCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-6">
              <p className="font-serif text-2xl">{site.name}</p>
              <p className="label mt-1">{site.title}</p>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Bio */}
        <Reveal delay={0.06} className="md:col-span-7 lg:col-span-8">
          <SpotlightCard className="h-full p-7 md:p-10">
            <p className="label mb-6">Who I am</p>
            <div className="space-y-5 text-lg leading-relaxed text-fg/85 md:text-xl">
              {about.bio.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Currently */}
        <Reveal delay={0.12} className="md:col-span-4 lg:col-span-4">
          <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-7">
            <p className="label flex items-center gap-2">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" /> Currently
            </p>
            <p className="font-serif text-2xl leading-snug md:text-3xl">{about.currently}</p>
          </SpotlightCard>
        </Reveal>

        {/* Location + time */}
        <Reveal delay={0.18} className="md:col-span-3 lg:col-span-4">
          <SpotlightCard className="flex h-full flex-col justify-between gap-8 p-7">
            <p className="label flex items-center gap-2">
              <MapPin className="size-3.5 text-accent" /> {site.location}
            </p>
            <div>
              <LocalClock timezone={site.timezone} className="font-serif text-4xl md:text-5xl" />
              <p className="label mt-2">Local time</p>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Stats */}
        <Reveal delay={0.24} className="md:col-span-12">
          <SpotlightCard className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {about.stats.map((s) => (
              <div key={s.label} className="p-7 md:p-8">
                <p className="font-serif text-5xl md:text-6xl">
                  <CountUp value={s.value} suffix={s.suffix} />
                </p>
                <p className="label mt-3">{s.label}</p>
              </div>
            ))}
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}
