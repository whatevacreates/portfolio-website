import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Section 01 — start human.
//
// Two phases, deliberately separate:
//   1. on arrival the pencil draws and the headline sets itself (autoplay,
//      so the page is never blank before the first scroll)
//   2. on scroll the handwriting resolves into typography (scrubbed, so the
//      visitor performs the transition rather than watching it)

const MARK = 'M 96,22 C 142,17 182,46 184,88 C 186,132 148,160 104,160 C 62,160 22,134 21,94 C 20,52 54,26 96,22';
const RULE = 'M 5,14 C 78,3 156,23 232,10 C 308,-2 386,18 461,7';

export default function Opening() {
  const root = useRef();

  useLayoutEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context((self) => {
      const q = self.selector;

      if (reduce) {
        gsap.set(q('.op-mark'), { opacity: 0 });
        gsap.set(q('.op-line > span'), { yPercent: 0, opacity: 1 });
        gsap.set(q('.op-script, .op-rule'), { opacity: 0 });
        gsap.set(q('.op-type'), { opacity: 1 });
        return;
      }

      // ── phase 1 · arrival ─────────────────────────────────────────────
      gsap.set(q('.op-line > span'), { yPercent: 115 });
      gsap.set(q('.op-type'), { opacity: 0 });
      gsap.set(q('.op-script'), { opacity: 0 });
      gsap.set(q('.op-rule path'), { strokeDashoffset: 1 });

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .to(q('.op-mark path'), { strokeDashoffset: 0, duration: 1.5, ease: 'power1.inOut' })
        .to(q('.op-mark'), { opacity: 0, scale: 1.4, duration: .7, ease: 'power2.in' }, '-=0.15')
        .to(q('.op-line > span'), { yPercent: 0, duration: 1.1, stagger: .12 }, '-=0.45')
        .to(q('.op-script'), { opacity: 1, duration: .7 }, '-=0.5')
        .to(q('.op-rule path'), { strokeDashoffset: 0, duration: .8, ease: 'power1.out' }, '-=0.35');

      // ── phase 2 · the thesis, scrubbed ───────────────────────────────
      gsap.timeline({
        scrollTrigger: { trigger: q('.op')[0], start: 'top top', end: '+=90%', scrub: .9 },
      })
        .to(q('.op-cue'), { opacity: 0, duration: .2 }, 0)
        .to(q('.op-rule'), { opacity: 0, duration: .35 }, .15)
        .to(q('.op-script'), { opacity: 0, filter: 'blur(7px)', yPercent: -6, duration: .5 }, .15)
        .to(q('.op-type'), { opacity: 1, duration: .5 }, .45);
    }, root);

    // webfonts change metrics, so remeasure once they land
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => ctx.revert();
  }, []);

  return <section className="op" ref={root}>
    <div className="op-stage">
      <svg className="op-mark" viewBox="0 0 206 182" aria-hidden="true">
        <path d={MARK} pathLength="1" />
      </svg>

      <h1 className="op-head">
        <span className="op-line"><span>Technology</span></span>
        <span className="op-line"><span>needs a</span></span>
        <span className="op-line op-swap">
          <span>
            <em className="op-script">human touch.</em>
            <em className="op-type">human touch.</em>
            <svg className="op-rule" viewBox="0 0 466 24" aria-hidden="true">
              <path d={RULE} pathLength="1" />
            </svg>
          </span>
        </span>
      </h1>

      <span className="op-cue">Scroll</span>
    </div>
  </section>;
}
