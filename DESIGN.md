# DESIGN.md

Design direction for Rao Ali's portfolio. It was written down from the published site (the owner's existing identity), so new work should follow it, and the antislop filter runs on top of it.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 3

Design Read: personal portfolio of an accountant and CRM specialist, for hiring managers and small-business clients, in a warm "ledger and brass" language.

## Identity

- **Personality:** careful, organised and approachable, with a playful streak (the desk panda). Precise first, then friendly.
- **Motif:** the ledger. Graph-paper grid behind the hero and the contact section, the brass "Ledger Orrery" around the headline, and invoices, calculator and drawers on the panda's desk. The grid is kept because it is accounting paper, not decoration.
- **Mascot:** the 3D panda at a desk. It does Rao Ali's real kinds of work (invoicing, reconciling, client calls, CRM review), which makes the services concrete.

## Palette

The page uses 2 core colours plus 1 accent. Neutrals don't count toward that.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `ink` | `#fbfaf8` | `#121110` | page background (warm paper, not pure white) |
| `fg` | `#111111` | `#f4f0eb` | text |
| `muted` | `#7a6b5f` | `#a69a8f` | secondary text (4.9:1 on the page) |
| `accent` | `#fe4f02` | `#fe5a12` | the one accent: icons, rules, large headline words, focus ring |
| `accent-strong` | `#c93a00` | same | filled buttons and chat bubbles with white text (5.1:1) |
| `accent-ink` | `#b83400` | `#ff8a50` | small orange text and links (5.7:1 / 7.5:1) |
| amber `#ffa800`, brown `#7a6b5f` | | | case-study cover tints only |

Reason: orange reads as warm and confident without the default blue/purple "tech" look. Plain `#fe4f02` is only 3.3:1 with white, so any text that sits on it uses `accent-strong`, and small orange text uses `accent-ink`.

## Typography

- **Manrope** (variable) for everything. Chosen for its open, even shapes that stay readable at small sizes in tables and labels. It is self-hosted.
- **Accent words** in headings are italic or orange (`*word*` in `lib/content.ts`). This is the typographic voice.
- **Small uppercase labels** with tracking are used only for wayfinding (nav, section labels, hero meta row), at 0.68 to 0.72rem. They never appear on sentences.

## Layout and rhythm

- Each section takes its shape from its content: a sticky scroll story (About), a card deck (services), grids for capabilities, a list for case studies, and a big type-led contact section.
- Radius: pills for buttons and chips, 28px for large cards and the chat panel, 16px for small cards. Inputs follow the button radius.
- Shadow marks elevation only: floating cards, the chat panel and launcher, and the primary CTA. Flat surfaces stay flat.
- Glass (backdrop blur) is used in two places only: the scrolled navbar and the chat panel. Both sit over moving content.
- Glow is used once, as the warm backdrop behind the About portrait.

## Motion (MOTION 3)

- **Hero:** the orrery assembles and turns slowly. It is the page's one focal moment. There is a Pause animation button, and it pauses with `prefers-reduced-motion`.
- **Sections:** they reveal once on scroll to guide reading order. Nothing loops except the two 3D scenes.
- **Panda:** works, reacts to clicks and the chat, and sleeps when idle. It shares the same pause control, and the desk stays usable while paused.
- **Removed:** endless pings, spinning rings and floating orbs, because they had no purpose.

## Icons

Lucide, used only where an icon labels an action or names a thing (mail, phone, calculator, folder). Its stroke weight matches Manrope's. No sparkle or "AI" glyphs. Arrows mean direction only:
- ↗ means the link leaves the page (social links, the mail app).
- → means it scrolls you somewhere on the page.
- ↑ means back to top.
- \+ means it opens details here.

## Copy

- First person on the site, third person in the panda's replies.
- No em dashes, no emoji in the interface, no hype words.
- Numbers appear only when they are real. Case-study sample tables are labelled "For demonstration only".
