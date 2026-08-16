# Archive

Preservation copies of work from **whatevacreates.com** that is *not* part of
the built site. Nothing here is rendered, imported, or served.

It lives outside `public/`, so Vite never copies it into `dist/`. Verified:
the production build ships 191 images, all from `public/media`, none from here.

## Contents

| Project | Images | Notes |
| --- | ---: | --- |
| `print-ads` | 20 | Print ads incl. Ministerie van OCW, Ploom TECH |
| `drawings-illustrations` | 20 | Drawings and illustrations |
| `extras` | 22 | On live pages but absent from the built site |
| `muru` | 9 | Ecological fabrics, palette from nature |
| `heartbeats` | 7 | Identity for an electronic music duo |
| `citylooker` | 2 | Advertising concept |
| `personal-projects` | 2 | Incl. Warsaw through the eyes of photographers |

**82 images, 8 animated.** `projects.json` records each project's title,
client, category, source page URLs, and for every image its original
Squarespace CDN URL and frame count.

`extras` also lists 9 YouTube IDs that appear on live pages. Those are already
embedded in the site via `src/portfolio-data.json`; they are recorded here only
so each archived project stays self-describing.

## Provenance

Every image was fetched at `?format=original` — the true source file, not a
CDN-resized derivative — then encoded to WebP at 2000px/q82 (animated:
1100px/q68), matching `scripts/optimize-media.mjs`. Frame counts on animated
files are preserved; where a count is lower than the source, libwebp collapsed
runs of identical consecutive frames, which leaves total duration unchanged.

Images already shipped in `public/media` were skipped, so there is no overlap
with the live site.

## Publishing something from here

1. Copy the files into `public/media/`
2. Add the project to `src/portfolio-data.json` following an existing entry
3. Cover image goes first in `images`; the rest render as the gallery

Re-scrape with the CDN URLs in `projects.json` if you ever need the originals
again.
