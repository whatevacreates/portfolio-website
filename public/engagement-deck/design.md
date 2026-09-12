# Engagement deck — design system

The scroll-animated sales deck at [try.schole.ai/engagement-deck](https://try.schole.ai/engagement-deck/).
One HTML page, no build step. This file is the fast path: tokens, patterns, and
the rules that got settled the hard way. Read it before restyling anything.

## Where things live

- **Edit here:** the `schole_side_quests-deploy` worktree (branch `feat/deck-scrub`).
  Eva's long-running `http.server 8000` serves THIS tree — changes here are what
  she sees locally. The main checkout is a different branch; don't edit the deck there.
- **Deploy:** GitHub Pages builds `main`. Commit on `feat/deck-scrub`, merge to
  `main`, wait 1–2 min for `pages build and deployment`. `static.yml` lies
  (its `live-site` trigger always fails) and `404.html` bounces wrong paths to
  app.schole.ai — test real paths.
- **Cache busting:** every deck.css/JS edit bumps the `?v=YYYYMMDD.n` query in
  `index.html`. Do it every time; the date is the day, `n` counts within the day.
- **Verify before calling anything done:** headless Chrome via
  `schole_backend/frontend/node_modules/playwright-core`, screenshot the section
  you touched. Characters animate in on timers — wait ~2.5s after scrolling, or
  drive them (`window.__pharos.at(p)`, `window.__lesson.seek(t)`).

## Tokens

Layout tokens and the engine live in `assets/brand.css`; section layout in `deck.css`.
Brand source of truth is `schole_backend/frontend/src/styles/colors.css`.

| Token | Value | Use |
|---|---|---|
| `--darkest` | `#0f172a` | slate-900: headline ink, the industry stat-tag plate |
| deep purple | `#543a80` | `--color-purple-deep` upstream: the Scholé stat-tag plate |
| stats ink | `#5f5a85` | the Scholé stats type on white |
| `--grad-a/-mid/-b` | `#9075c0 #7173c8 #6e94cf` | the brand gradient family |
| `--turquoise` | `#a3dbd2` | CTA accents |
| Pharos | `#75bac3` `#9ae0eb` `#bffaff` `#636363` | body, inner, cheeks/ray, pupil — from `deck-work/pharros long.svg`; the ray's light stop is `#bffaff` |
| Olé | `#ffe05f` `#d39448` `#f4b373` `#7a613d` `#aa7a2f` | bulb, body, panel, pupils, brows — these are locked; a bronze recolor was tried and reverted |

Type: New Spirit (`--ns`) for display/serif moments, Inter for body. Eyebrow
style = 12px/600/.22em tracking/uppercase; the stat-tags are that eyebrow in
white on a plate.

## Section patterns

- `.sec` sizes to its content; its `clamp(56px,8vh,96px)` padding meets its
  neighbour's, so the visible gap between sections is 2× that. Only `.cover`
  still claims 100svh. `.wrap` caps at 1180px. Sections are
  driven by `assets/scroll.js`: `[data-sec]` + `data-bg`/`data-ink`,
  `[data-reveal]` staggered by `data-step`, `[data-count]` counters,
  `[data-words]` per-word masks. New sections get a dot in the `.dots` nav —
  the indexing breaks silently if you forget.
- **Stats on white (`.teach`):** the white plate and the dissolve pattern
  (`stat-edge.svg`, 7028.94×857.84, bottom 11% solid) move TOGETHER —
  `--stat-drop` shifts both; the plate must start where the pattern's rows have
  closed or its edge shows through the pores. `.stat-edge-top` sits at z-index 2,
  above the column, so Pharos emerges from behind it.
- **Benchmark stacks:** industry stats vs Scholé stats, each flagged by a
  `.stat-tag` plate, no rules/dividers between stats — spacing does the grouping.

## Characters

- **Olé** (`teach.js`) walks the headline plate, scrubbed by scroll; feet gait,
  reading eyes and brows are CSS/GSAP on the inline rig in `index.html`.
- **Pharos** (`pharos.js` sets `--p` drop and `--r` ray-throw; everything else is
  deck.css): hangs on his own pole (a stub of it is inside the head SVG so the
  cord joins seamlessly), rolls down from `--ceil` — the top of the white layer,
  behind the pattern — swings ±1.5° idle, blinks twice per ~5s, and the pupil
  glances onto the stats as the ray throws. The stacked mobile layout sets
  `--ceil:0` (no ceiling there).
- **The lesson** (`lesson.js` + `assets/exercises.js`): Scene B of the Harvard
  Way film as a 16:9 embed, the film's camera ported shot-for-shot, playing on
  a clock while on screen. See the header comments in `lesson.js`.

## Rules that are settled

1. **Nothing pins the scroll.** Film scenes embed as self-playing video-sized
   blocks; sticky scroll-scrub reads as being stopped and was ripped out.
2. **Cut, don't explain.** Fewer labels, shorter copy, remove before restyling.
3. **Assets keep their provenance.** Character colors and geometry come from
   their source files (`deck-work/`, the Rive artboards, the film) — sample,
   don't invent. Note the source in a comment when you vendor something.
4. **Reference images are a spec for what was named, not a redesign brief.**
5. **Reduced motion always has an answer:** parked characters, finished states,
   `animation:none`.
