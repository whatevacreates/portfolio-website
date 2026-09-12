# transformation-constellation

The constellation transformation page as a static site, served at
**[try.schole.ai/transformation-constellation](https://try.schole.ai/transformation-constellation/)**.

Build output, not source — the page lives in [`../transformation`](../transformation).
It sits at the repo root rather than inside that folder so publishing it
never triggers the app's k8s deploy, which watches `transformation/**`.

## What works, and what does not

The page is baked in as `page.json`, so everything renders with no backend:
the cover, the journey, the three team journeys, the booking section.
**Olé cannot answer** — editing the journey is an LLM call per answer, and
needs the API.

For the live version, `transformation.schole.ai` has to run a backend that
allows this origin (`PUBLIC_CORS_ORIGINS`, added alongside this) and carry a
page under this slug. Then rebuild without the snapshot argument and the
page talks to the API instead of its own copy.

## Rebuilding

```bash
cd transformation
curl -s https://transformation.schole.ai/api/public/pages/<slug>/ -o /tmp/page.json
OUT=../transformation-constellation BASE=/transformation-constellation/ \
  ./build-static-page.sh constellation /tmp/page.json
```
