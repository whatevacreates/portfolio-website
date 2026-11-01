# your-path-forward

A B2C landing page started as a copy of `../join/` (October 2026). One offer, one
call to action: 80% off the first month of Scholé. Static HTML, a local
stylesheet and JavaScript, no build step. Live at
**https://try.schole.ai/your-path-forward/** once `main` deploys (the folder is
on `.github/pages-allowlist.txt`).

PostHog events carry `page: 'your-path-forward-landing'` and the Reddit pixel
reports the product id `your-path-forward`, so this page and `/join` can be told
apart. Changes to `/join` do not flow here; copy them across by hand.

## The two things you need to set

Both live in `config.js`, and nothing else needs editing:

1. `checkoutUrl`. The Stripe payment link for the discounted first month. Every
   call to action on the page opens it directly, in a new tab. The link carries
   `prefilled_promo_code`, which is what makes the price on the page the price
   at checkout, so change the two together or they drift apart.
2. `saleEndsAt`. An ISO 8601 timestamp with an explicit offset. The strip
   counts down to it live and the offer section names the date. Past the
   deadline the strip reads "Offer closed" and the countdown stops.

The same link is written into every call to action in `index.html`, so the
buttons work before the script runs and without JavaScript at all. `page.js`
rewrites them from `checkoutUrl` on load, which is why `config.js` is the one
place to edit.

## Structure

- `index.html` contains the page and integrations; `styles.css` contains the
  responsive layout; `page.js` handles the menu, the example panels, motion, the
  countdown and the Stripe embed; `characters.js` animates the four inline
  Scholé mascots. New Spirit and Inter fonts and the logo come from `../assets/`.
- America.gov provides the layout and motion reference, matching
  `../cybersecurity/`: a thin strip above an inset rounded hero, staggered
  entrance, a large centered statement with interactive inline artwork, square
  visual panels in alternating rows, and a floating bar. Here the strip carries
  the countdown, the hero carries the price, and the reference's closing
  showcase section becomes the checkout.
- `styles.css` is `../cybersecurity/styles.css` with the offer rules appended
  (the strip, the price block, the offer section and the dock price). Keep the
  shared part in sync if the cybersecurity page's layout changes.
- Olé, Zeteo, Atlas and Pharos use the landing repo's actual Rive animations in
  circular inline badges; see `assets/rive/README.md` for provenance. Other
  panels use the Olé SVG poses, and the rotating globe keeps the lesson art.
- Button sizing, 8px corners and colors match `schole_landing_site`'s
  `src/components/button.ts`; headings use New Spirit and body text uses Inter.
- Clicks on `[data-ph]` fire PostHog events, in the same project as the other
  try.schole.ai landings.
- Animation pauses offscreen, has explicit pause controls, and respects reduced
  motion. All content stays readable without JavaScript, and the checkout falls
  back to a signup link.
- The countdown runs to a fixed public deadline rather than a per visitor timer
  that resets on every reload.

House copy rules apply: no em or en dashes, never "free", never "LMS", no
duration promises, no claims we cannot verify.

Preview locally from the repo root, since the page references `../assets/`:

```bash
python3 -m http.server 8000   # http://localhost:8000/your-path-forward/
```
