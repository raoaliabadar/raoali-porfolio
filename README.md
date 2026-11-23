# Rao Ali Badar — Accountant & CRM Specialist Portfolio

A premium light portfolio (warm minimal theme, grid background, dashboard-style hero, bento cards, swipeable service deck, hover-preview case studies) built with **Next.js 16**, **Tailwind CSS v4** and **Motion**.

## 1. Run locally

Requires **Node.js 20+**.

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 2. Edit your content

**All text lives in one file: `lib/content.ts`.** Everything there is sample content — replace it with your own.

| What | Where in `lib/content.ts` |
|---|---|
| Name, title, email, socials | `site` |
| Hero headline, tagline + info columns | `hero` |
| About statement, bio, facts, stats | `about` |
| Stacked service cards | `services` |
| CRM capabilities + platform cards | `crm` |
| Accounting & financial operations | `accounting` |
| Jobs (timeline) | `experience` |
| Skill cards | `skills` |
| Case studies | `projects` |
| Grouped tools | `tools` (icon names from https://simpleicons.org) |
| Education, certificates | `achievements` |
| Closing call-to-action | `contact` |

Empty lists (experience, CRM platforms, tools, stats, achievements) hide their section automatically.

Lines marked ✏️ in the file are the ones you should definitely change.

- Headline / headings: wrap a word in `*asterisks*` to make it italic amber.
- **Photo:** replace `/public/portrait.jpg` with a new photo (same name, ~3:4 portrait ratio).
- **Logo:** `components/ui/Logo.tsx` (RA monogram, used in nav, footer, photo card).
- **Favicon:** `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`.
- **Project screenshots:** put images in `/public/projects/`, then set `image: "/projects/voyage.jpg"`.
- **Résumé:** put `resume.pdf` in `/public`, then set `site.resumeUrl: "/resume.pdf"`.

## 3. Upload to GitHub

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```

(Create the empty `portfolio` repo on github.com first — no README.)

## 4. Deploy on Vercel (free)

1. Go to https://vercel.com → sign in with GitHub.
2. **Add New → Project** → import your `portfolio` repo.
3. Framework is detected as **Next.js** automatically → click **Deploy**.
4. After ~1 minute you get a live URL. Copy it into `site.url` in `lib/content.ts`, commit and push — Vercel redeploys automatically on every push.

**Custom domain (optional):** Vercel → Project → Settings → Domains → add your domain and follow the DNS instructions.

## Project structure

```
app/            layout (fonts, SEO), page, globals.css (design tokens)
components/
  Nav.tsx, Footer.tsx
  ui/ServiceDeck.tsx  stacked card deck
  sections/     Hero, About, Crm, Accounting, Experience, Skills, Projects, Tools, Achievements, Contact
  ui/           Reveal, SpotlightCard, CountUp, MagneticButton, LocalClock, ...
lib/
  content.ts    ← all your content
  motion.ts     shared easing + animation presets
```

## Design tokens

Colours, fonts and animation keyframes are in `app/globals.css` under `@theme`.
Change `--color-accent` (orange), `--color-cyan` (darker orange for hovers) and `--color-glow` (peach glow) to re-theme the whole site. Grid background: `.bg-grid`.

## Accessibility & performance

- Respects `prefers-reduced-motion` (Motion `reducedMotion="user"` + CSS fallback; the tools marquee becomes a static grid).
- Skip link, keyboard-accessible timeline & project dialog (Esc to close, focus trap), visible focus rings.
- Static pages, self-hosted fonts. The only runtime request is the panda chat (`/api/chat` → Claude API), which happens only when a visitor sends a message.

## Panda AI assistant

A floating 3D panda assistant (bottom-right) answers visitors' questions about you, by text or voice, and scrolls them to the right section.

**Setup (one time):**

1. Create a Claude API key at <https://platform.claude.com/>.
2. Locally: copy `.env.example` to `.env.local` and paste the key after `ANTHROPIC_API_KEY=`.
3. On Vercel: **Project → Settings → Environment Variables** → add `ANTHROPIC_API_KEY` (Production + Preview), then redeploy.

Without a key the panda still works, using offline answers built from `lib/content.ts`.

**What it knows:** everything in `lib/content.ts`, plus the extra facts you add in `lib/assistant/config.ts` (`extraFacts`). It won't invent experience or achievements. Those sections are empty right now, so it says they aren't listed yet. Fill in `experience` / `achievements` in `lib/content.ts` and it will use them.

**How it works**

| Piece | File |
| --- | --- |
| Secure backend (Claude API, streaming, rate limit, input checks) | `app/api/chat/route.ts` |
| Knowledge base built from your content | `lib/assistant/knowledge.ts` |
| Your editable settings: greeting, suggested questions, extra facts | `lib/assistant/config.ts` |
| Offline answers + hidden commands | `lib/assistant/local.ts` |
| Section navigation (ids + descriptions) | `lib/assistant/sections.ts`, `lib/assistant/navigate.ts` |
| Chat UI (lazy-loaded) | `components/assistant/ChatPanel.tsx` |
| Launcher, welcome, sleep timer | `components/assistant/PandaAssistant.tsx`, `components/assistant/idle.ts` |
| Voice (Web Speech API: speech-to-text + text-to-speech) | `components/assistant/useVoice.ts` |
| 3D panda animations, moods and reactions | `components/ui/DeskScene.tsx`, `lib/panda.ts` |

- **Model:** `claude-opus-5-5` at low effort, so replies are short and quick. Server-side refusal fallback is on (`fallbacks: "default"`). Change `MODEL` in `app/api/chat/route.ts` if you want to.
- **Voice:** speech-to-text works in Chrome, Edge and Safari. Firefox gets a "not supported" hint and visitors can still type. Replies are read aloud after a visitor speaks to the panda, or once they turn on the speaker icon.
- **Panda moods:** idle, listening, thinking, talking and sleeping (after 60 s with no activity), plus reactions: wave, cheer, nod, think, surprised, confused, dizzy, dance and spin. The panda is built in code with three.js, with no model file or animation clips, so every animation is procedural.
- **Easter eggs:** a welcome for first-time visitors. A random cute reaction per click, and 5 quick clicks make it dizzy. It falls asleep when idle and wakes up when you move. Hidden chat commands: `dance`, `spin`, `high five`, `bamboo`, `celebrate`, `sleep`, `wake up`, `help`.
