# Rao Ali Badar â€” Accountant & CRM Specialist Portfolio

A full-screen, slide-by-slide Accounting & Finance portfolio (forest green and beige) built with **Next.js 16**, **Tailwind CSS v4**, **GSAP**, **three.js** and **Chart.js**.

## 1. Run locally

Requires **Node.js 20+**.

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 2. Edit your content

**All text lives in one file: `lib/content.ts`.** Everything there is sample content â€” replace it with your own.

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

Lines marked âœï¸ in the file are the ones you should definitely change.

- Headline / headings: wrap a word in `*asterisks*` to make it italic amber.
- **Photo:** replace `/public/portrait.jpg` with a new photo (same name, ~3:4 portrait ratio).
- **Logo:** `components/ui/Logo.tsx` (RA monogram, used in nav, footer, photo card).
- **Favicon:** `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`.
- **Project screenshots:** put images in `/public/projects/`, then set `image: "/projects/voyage.jpg"`.
- **RÃ©sumÃ©:** put `resume.pdf` in `/public`, then set `site.resumeUrl: "/resume.pdf"`.

## 3. Upload to GitHub

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```

(Create the empty `portfolio` repo on github.com first â€” no README.)

## 4. Deploy on Vercel (free)

1. Go to https://vercel.com â†’ sign in with GitHub.
2. **Add New â†’ Project** â†’ import your `portfolio` repo.
3. Framework is detected as **Next.js** automatically â†’ click **Deploy**.
4. After ~1 minute you get a live URL. Copy it into `site.url` in `lib/content.ts`, commit and push â€” Vercel redeploys automatically on every push.

**Custom domain (optional):** Vercel â†’ Project â†’ Settings â†’ Domains â†’ add your domain and follow the DNS instructions.

## Project structure

```
app/            layout (fonts, SEO), page, globals.css (design tokens)
components/
  Nav.tsx, Footer.tsx
  ui/ServiceDeck.tsx  stacked card deck
  sections/     Hero, About, Crm, Accounting, Experience, Skills, Projects, Tools, Achievements, Contact
  ui/           Reveal, SpotlightCard, CountUp, MagneticButton, LocalClock, ...
lib/
  content.ts    â† all your content
  motion.ts     shared easing + animation presets
```

## Design tokens

Colours, fonts and animation keyframes are in `app/globals.css` under `@theme`.
Change `--color-accent` (orange), `--color-cyan` (darker orange for hovers) and `--color-glow` (peach glow) to re-theme the whole site. Grid background: `.bg-grid`.

## Accessibility & performance

- Respects `prefers-reduced-motion` (Motion `reducedMotion="user"` + CSS fallback; the tools marquee becomes a static grid).
- Skip link, keyboard-accessible timeline & project dialog (Esc to close, focus trap), visible focus rings.
- Static pages, self-hosted fonts. No AI: no AI APIs, chatbots or generated assets; every figure is plain JavaScript arithmetic on sample data.

## Slide portfolio (home page)

The home page is eight full-screen slides, one at a time:
01 Workspace (3D office) Â· 02 About Â· 03 Accounting demos Â· 04 Dashboard Â· 05 Tools Â· 06 Experience Â· 07 Projects & education Â· 08 Contact.

- **Navigation:** mouse wheel / trackpad (one slide per gesture), touch swipe, â†‘ â†“ â† â†’ / Page Up / Page Down / Space / Home / End, the side dots, previous / next buttons and the header menu. Each slide has its own URL (`/#about`, `/#contact`â€¦).
- **Tall content** (phones, wide tables) scrolls inside its slide first; the deck moves on at the end.
- **Reduced motion:** a short crossfade between slides and nothing else moves.

| Piece | File |
| --- | --- |
| Slide list (order, ids, titles) | `lib/slides.ts` |
| Slide engine: input, transitions, dots, counter | `components/slides/SlideDeck.tsx` |
| The slides | `components/slides/*Slide.tsx` |
| Accounting demos (spreadsheet, P&L, calculator, invoice, reconciliation) | `components/slides/AccountingDemos.tsx` |
| Slide text: headline, profile, platforms, operations, case studies | `lib/content.ts` (section 13) |
| Fictional sample figures (demos + dashboard) | `lib/sample-data.ts` |
| 3D office, panda and its reactions | `components/ui/DeskScene.tsx`, `lib/panda.ts` |
| Achievement wall (framed certificates, also listed on slide 07) | edit at `/wall-editor`; code in `lib/wall/`, `app/api/wall/`, `components/wall/WallEditor.tsx` |

**Still to fill in** (âœï¸ in `lib/content.ts`): your degree, institution and years (`profile.education`), and your job title / company if you want them shown (`profile.current`). Empty fields are simply not displayed.
