# Waqar Sheikh — Portfolio

A premium, dark editorial portfolio built with **Next.js 16**, **Tailwind CSS v4** and **Motion**.

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
| Name, title, headline, email, socials | `site` |
| Bio, stats, "currently", photo | `about` |
| Jobs (timeline) | `experience` |
| Skill cards | `skills` |
| Projects + case studies | `projects` |
| Tool icons | `tools` (icon names from https://simpleicons.org, e.g. `siReact`) |
| Numbers + awards | `achievements` |

- Headline / headings: wrap a word in `*asterisks*` to make it italic amber.
- **Photo:** put `portrait.jpg` in `/public`, then set `about.portrait: "/portrait.jpg"`.
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
  sections/     Hero, About, Experience, Skills, Projects, Tools, Achievements, Contact
  ui/           Reveal, SpotlightCard, CountUp, MagneticButton, LocalClock, ...
lib/
  content.ts    ← all your content
  motion.ts     shared easing + animation presets
```

## Design tokens

Colours, fonts and animation keyframes are in `app/globals.css` under `@theme`.
Change `--color-accent` to re-theme the whole site.

## Accessibility & performance

- Respects `prefers-reduced-motion` (Motion `reducedMotion="user"` + CSS fallback; the tools marquee becomes a static grid).
- Skip link, keyboard-accessible timeline & project dialog (Esc to close, focus trap), visible focus rings.
- Fully static output, self-hosted fonts, no external requests.
