# exciting_sales_decks

Scroll-animated sales pages for Scholé. Each deck is one HTML page that plays as
you scroll: the background crossfades between sections, headlines land, numbers
count up, bars fill.

No build step, no dependencies — a static folder in `schole_side_quests`, served
at [try.schole.ai/exciting_sales_decks](https://try.schole.ai/exciting_sales_decks).
Open `index.html` from disk, or:

```bash
python3 -m http.server 8000   # http://localhost:8000/sales-decks/
```

```
assets/          brand tokens (brand.css), the scroll engine (scroll.js), fonts, marks
assets/vendor/   gsap.min.js (3.15.0, standard licence) — vendored, no CDN
<deck-name>/     one deck: index.html + deck.css, plus any deck-only JS
```

## Adding a deck

Copy `engagement-deck/` and rewrite the sections. The engine only needs
three hooks:

| hook | does |
| --- | --- |
| `data-sec` + `data-bg="cover\|purple\|mist\|payoff"` + `data-ink="dark\|light"` | a full-height section; owns the background and ink while it holds the viewport |
| `data-reveal` (`""`, `left`, `right`, `scale`, `blur`) | lands when its section arrives; staggered in document order |
| `data-count="1240"` (`data-from`, `data-suf`, `data-pre`, `data-dur`, `data-dec`) | counts from zero, or from `data-from`, on arrival |

`.plate` wipes a white plate behind a headline, `.draw` draws a rule, `.bar` with
`--to:76%` fills, `data-words` splits a line into per-word masks that rise in
sequence, and `data-parallax="-26"` drifts an element against the scroll.
Everything collapses to a static page under `prefers-reduced-motion`.

## The cover collision

Deck 01 opens on a set piece rather than a headline. The page arrives already
composed — **LMS** on screen, the city, the date, the authors, the cue — and then
*The AI-native LMS* travels in from the left. On the frame its leading edge
reaches the L, the two move together: the old word does not budge before it is
touched, and from then on it is displaced by exactly as much as the title
advances.

The whole thing is measured in pixels off the real boxes after
`document.fonts.ready`, so contact lands where it looks like it should at any
width, in any face. Being shoved, the word resists — it grinds, slips, grinds
again — and the impulse reaches L before M before S, so the word breaks its own
spacing on its way out. There is no effects layer: no flash, no camera shake, no
debris.

**LMS is centred and alone until it is hit.** The collision plays itself once,
on load, with the page held still (`html.locked`). `html.intro`, claimed by an
inline script in `<head>`, keeps the cover from flashing its finished state
before GSAP takes over; a 6-second failsafe in that same script drops both
classes if GSAP never loads.

**The old word gets a short leash.** Scroll away from the cover and back to the
top and it returns — rewound at 3.2×, left standing for 0.35s, then hit again
at 1.35×. End to end it is on screen about 1.8s. It never gets to stay.

Two things that will bite anyone editing `measure()`. It must **never** clear
the live `x` — read the rect and subtract the current `x` instead. And every
section reveal toggles rather than firing once, so the deck plays backwards on
the way up.

It lives in [`engagement-deck/intro.js`](engagement-deck/intro.js) — the
only part of the kit that uses GSAP; the scroll sections stay on the plain
IntersectionObserver engine. While tuning, seek it from the console:

```js
__intro.progress()          // where the scrollbar has it
__intro.progress(0.44)      // jump to the frame of contact
__intro.scrollTrigger.end   // how much scroll the collision is worth
```

Two things to know before editing it. GSAP absorbs any CSS `transform` already
on an element as a **pixel** offset and adds its own on top, so anything it
drives starts from `transform:none` (see `.cover-sub .w > i`). And the root
clips horizontally — letters pushed out of frame would otherwise widen the
layout viewport on phones.

## The close transition

Between enterprise readiness and the close there is a band that turns the mist
into the purple. It is one star — the small one you see at the top, at one size
throughout — repeated on a lattice that **closes as it descends**. Each gap
between two rows is `DECAY` smaller than the gap above it, and the spacing along
the rows steps down with it, so the field thickens row after row.

**Nothing here moves.** The star always stands upright, position is a function of
`(row, column)`, and the whole band is drawn once at full strength. It is a
printed pattern, not an animation — the page moves past it. That also means
there is no scroll listener and nothing to write to on a frame; the only thing
it reacts to is a resize, which rebuilds it.

### The rows interleave in pairs

Two rows a pitch apart interleave exactly: the second starts in the middle of
the first one's gaps. That only holds **while they share a pitch**, so the
spacing along the rows steps down every second row, not every row. Shrink it row
by row and each row lands a little off the gap above it, further off the further
along the row you look, and the field goes to moiré — visible as diagonal
streaks running through the middle of the band.

### It closes in two movements

`DECAY` is 1.05, a twentieth at a time, which is a halftone rather than a set of
stages — and it is also why the band is as tall as it is. **A decay this slow
needs room.** Going from a gap of `g` down to a star's height is worth
`(g - starH) × DECAY / (DECAY - 1)` of band, so at 1.05 a gradient with any range
in it costs several hundred pixels; in the 330px band this used to be, 1.05 was
a flat field with a purple strip under it. `CLOSE_BY` says how much of the band
that first movement gets, and the first gap is derived from it, so the two stay
in step whatever you set.

The second movement is the lace shutting, at `CLOSE_DECAY` — a brisker 1.28,
starting the moment the rows have merged. Past that point no row is legible as a
row and carrying a twentieth at a time on would spend the rest of the band
creeping towards a spacing it never reaches. It is over in six rows.

`STAR` is in **pixels against the viewport, not against the band**, so the band
can be given the room the slow decay needs without the star growing with it.

### It is stars all the way down

There is **no fill and no plate** under any of this. The solid at the foot of
the band is stars, packed until they close, which is the only way it meets the
footer without an edge. There was a fill behind it for a while, laid in at the
depth where the lace was finest — and it read as exactly the hard line it was,
because the lace had not shut yet where its top sat. Anything laid in behind
will do the same unless it starts below where the stars are already solid, and
by then it is saving nothing.

`MIN_GAP` and `MIN_PITCH` are what make that possible, and they are the
sensitive numbers here. A star with concave sides does not tile: the holes
between four of them shrink with the spacing but never vanish, so wherever the
spacing stops shrinking is the finest the lace ever gets. At half a star and
four fifths of one it never closed at all. A quarter and a bit under a half do
close it, and the rows below carry it to the bottom edge.

It costs about 4,800 stars at desktop, 18 ms to build. That is paid once, at
load — nothing is written to on a frame — but a window drag fires `resize` on
every frame of itself, so the rebuild is **debounced**; take that off and a drag
runs 18 ms of DOM per frame.

Two things that were tried and are worse, so that they are not tried again:

- **Four offsets instead of two below the merge**, to put a star every quarter
  pitch for free. It scatters the residual holes rather than closing them, and
  the foot of the band comes out speckled instead of solid.
- **Tightening the floors further.** It does close the last holes, at three
  hundred stars a row on rows four pixels apart — several thousand more elements
  for something already invisible at 1×.

```js
__stars.lattice        // what the current width drew
__stars.rebuild()      // redraw after editing the constants
```

## Decks

- **[The AI-native LMS](engagement-deck/)** — the corporate-learning pitch:
  the collision, the problem, the cost of it, built-to-teach, learning science,
  the platform, enterprise readiness, the payoff, the close.

## Brand

Type is two families, both self-hosted in `assets/fonts`: New Spirit for display
and headings, set at a `line-height` of `.9` across the display sizes, and Inter
(the variable face) for all body text. Any one screen holds at most three text
sizes: a headline, the lede, and `--fs-small`, the single size every caption,
note and label shares. Colours and gradients
are lifted from the product's `colors.css`; Olé and the logo lockup come from
`ph assets` / `presentation-details`.

`assets/img/thinker-clean.webp` is Auguste Rodin's *The Thinker (Le Penseur)*, model
1880, cast 1901, from the National Gallery of Art — **CC0**, via Wikimedia
Commons. The bronze and stone are a sharply matted transparent cutout. Its
contact and cast shadows are separate CSS layers in `deck.css`, keeping the
base crisp while the shadow stays darkest at contact and softens with distance.

`assets/img/perseus-cellini-weber-cutout.png` is Benvenuto Cellini's *Perseus
with the Head of Medusa* (c. 1545–1554), photographed by Bradley Weber,
**CC BY 2.0**, via Wikimedia Commons. The transparent cutout was made from the
source photograph with Adobe's background-removal tool.
