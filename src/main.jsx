import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowLeft, ArrowUpRight, Menu, Play, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Opening from './opening.jsx';
import HoloMesh from './holomesh.jsx';
import { Blog, BlogPost, posts } from './blog.jsx';
import { LangContext, useT, getLang, saveLang } from './i18n.jsx';
import data from './portfolio-data.json';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

// media lives in public/media and is referenced as "/media/..." in the data.
// BASE_URL-relative resolution keeps those URLs working when the site is
// hosted under a subpath (e.g. GitHub Pages project sites).
const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '');

const nav = [
  ['work', 'Work', 'Arbeit'],
  ['photography', 'Photography', 'Fotografie'],
  ['blog', 'Blog', 'Blog'],
  ['about', 'About', 'Über mich']
];

function Header({ page, navigate, lang, setLang }) {
  const [open, setOpen] = useState(false);
  const tr = useT();
  const go = (next) => { setOpen(false); navigate(next); };
  return <header className="site-header">
    <button className="brand" onClick={() => go('work')} aria-label="Go home">
      <strong>Eva Przybyla</strong>
      <span>· Marketing & Creative Lead</span>
    </button>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
      {open ? <X /> : <Menu />}
    </button>
    <nav className={open ? 'open' : ''} aria-label="Primary navigation">
      {nav.map(([key, en, de]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => go(key)}>{tr(en, de)}</button>)}
      <button className="lang-toggle" onClick={() => { setOpen(false); setLang(lang === 'de' ? 'en' : 'de'); }}
        aria-label={lang === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}>
        {lang === 'de' ? 'EN' : 'DE'}
      </button>
    </nav>
  </header>;
}

// the career story, not the chronology: leadership and strategy first,
// then the depth of creative execution. Each card = gif + recruiter-keyword
// label; names and labels live in the project data. An optional third value
// scales the gif below the card width.
const reels = [
  ['schole-ai', '/media/schole-ai-01-schole-logo.webp', .8],
  ['team-nl', '/media/team-nl-01-zo-doen-we-dat3.webp'],
  ['new-page', '/media/new-page-01-dobbi-icon-v2.webp'],
  ['mcwalk', '/media/mcwalk-01-mcwalk.webp'],
  ['adidas-ub', '/media/adidas-ub-01-adidas-product-video-icons.webp'],
  ['slime', '/media/slime-01-slime-icon2.webp'],
  ['adidas-email', '/media/adidas-email-01-adidas-crm2.webp'],
  ['reebok', '/media/reebok-01-go-elemental-xx.webp'],
  ['royal-canin-social-campaign-2', '/media/royal-canin-social-campaign-2-01-rc-ikonka.webp'],
];

// the reel labels, in German — content-level German (case stories, blog
// articles) stays English; the chrome and labels switch
const labelsDe = {
  'schole-ai': 'Marketing-Leadership · Produktmarketing · GTM · KI',
  'team-nl': 'Markenstrategie · Integrierte Kampagne · Kreative Leitung',
  'new-page': 'Service-Launch · Integriertes Marketing · Digitales Produkt',
  'adidas-email': 'CRM · Lifecycle-Marketing · Kundenbindung',
  slime: 'Produkt-Launch · Globale Kampagne · Kreativstrategie',
  'royal-canin-social-campaign-2': 'Behavioural Insight · Markenstrategie · Social-Kampagne',
  reebok: 'Digitale Kampagne · Mobile Experience · Kreativkonzept',
  mcwalk: 'Markenaktivierung · Experience-Marketing · Kreative Leitung',
  'adidas-ub': 'Produkt-Storytelling · Launch-Kampagne · Art Direction',
};

// the hand-drawn four-point sparkle, cropped straight out of the logo
// animation's final frame — a few of them twinkle around the logo tile on
// their own offbeat rhythms
const Sparkle = ({ n }) => <img className={`sparkle sparkle-${n}`} src={asset('/media/schole-sparkle.png')} alt="" aria-hidden="true" />;

function Work({ openProject }) {
  const root = useRef();
  const tr = useT();
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.reel > *').forEach((el) => gsap.from(el, {
        y: 55, opacity: 0, duration: .9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }));
    }, root);
    return () => ctx.revert();
  }, []);
  return <main ref={root}>
    <Opening greeting={tr('Put your seatbelts on. We are off for an adventure.', 'Anschnallen, bitte. Wir starten ins Abenteuer.')} />
    <section className="reel">
      {reels.map(([slug, src, size], i) => {
        const project = data.projects.find((p) => p.slug === slug);
        const img = src && <img src={asset(src)} alt="" loading={i < 3 ? 'eager' : 'lazy'} style={size ? { width: `${size * 100}%` } : undefined} />;
        return <button className="reel-item" key={slug} onClick={() => openProject(slug)} aria-label={`View project: ${project.cardTitle}`}>
          {src
            ? (slug === 'schole-ai'
              ? <span className="sparkle-wrap">{img}{[0, 1, 2, 3, 4].map((n) => <Sparkle key={n} n={n} />)}</span>
              : img)
            : <span className="reel-tile"><HoloMesh />{project.title}</span>}
          <em className="reel-label">{tr(project.label, labelsDe[slug])}</em>
        </button>;
      })}
    </section>
  </main>;
}

// Small assets (banners, animated icons) look upscaled and soft when stretched
// across the full gallery width, so they run three-up at their intrinsic size.
// Runs of consecutive small images are chunked in place to keep the case order.
const SMALL_WIDTH = 1000;

function layoutGallery(images) {
  const blocks = [];
  let run = [];
  const flush = () => {
    // a lone small image would sit at a third-width with two empty cells,
    // so it gets centred at its own size instead of forced into a row
    if (run.length === 1) { blocks.push({ solo: run.pop() }); return; }
    const rows = [];
    while (run.length) rows.push(run.splice(0, 3));
    // a run of 4 chunks to [3,1], stranding one — rebalance the tail to [2,2]
    const last = rows[rows.length - 1];
    if (rows.length > 1 && last.length === 1) last.unshift(rows[rows.length - 2].pop());
    rows.forEach((row) => blocks.push({ row }));
  };
  for (const image of images) {
    const meta = data.meta?.[image];
    // ultra-tall pieces (scrolling email mockups and the like) never share a
    // row: they stand alone, centred, under whatever came before them
    if (meta && meta.h > meta.w * 2) { flush(); blocks.push({ solo: image }); }
    else if (meta && (meta.animated || meta.w < SMALL_WIDTH)) run.push(image);
    else { flush(); blocks.push({ full: image }); }
  }
  flush();
  return blocks;
}

function VideoEmbed({ video, eager }) {
  const [playing, setPlaying] = useState(false);
  return <figure className="case-video">
    {playing
      ? <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen loading="lazy" />
      : <button className="video-facade" onClick={() => setPlaying(true)} aria-label={`Play video: ${video.title}`}>
          <img src={asset(video.poster)} alt="" loading={eager ? 'eager' : 'lazy'} />
          <span className="video-play"><Play /></span>
        </button>}
  </figure>;
}

// story-driven case pages: text, quotes and films interleaved with the
// imagery, in the order the original whatevacreates.com page tells it.
// consecutive images run through the same size-aware gallery layout.
// live pages embedded in a case: a self-contained copy of the page sits in
// public/<slug>/ and loads inside a browser-like frame. Copies are static
// (no API, no LLM calls), so they keep working when the live sites change.
function CaseEmbed({ item, tr }) {
  const [open, setOpen] = useState(false);
  return <figure className="case-embed" style={item.height ? { '--embed-h': item.height } : undefined}>
    <div className="case-embed-frame">
      <div className="case-embed-bar"><i /><i /><i /><span>{item.url}</span></div>
      {open
        ? <iframe src={asset(item.embed)} title={tr(item.caption, item.captionDe)} loading="lazy" />
        : <button className="case-embed-poster" onClick={() => setOpen(true)} aria-label={tr('Open the interactive page', 'Interaktive Seite öffnen')}>
            <img src={asset(item.poster)} alt="" loading="lazy" />
            <span>{tr('Click to explore the page', 'Klicken, um die Seite zu erkunden')}</span>
          </button>}
    </div>
    <figcaption>
      <span>{tr(item.caption, item.captionDe)}</span>
      {item.url && <a href={`https://${item.url}`} target="_blank" rel="noreferrer">{tr('Live page', 'Live-Seite')} <ArrowUpRight /></a>}
    </figcaption>
  </figure>;
}

function renderStory(story, title, tr) {
  const out = [];
  let run = [];
  let counter = 0;
  const flush = () => {
    if (!run.length) return;
    const imgs = run; run = [];
    out.push(<div className="case-gallery" key={`g${out.length}`}>{layoutGallery(imgs).map((block, b) => {
      counter += 1;
      if (block.row) return <div className="case-row" key={`row-${b}-${block.row[0]}`} style={{ gridTemplateColumns: `repeat(${Math.min(block.row.length, 3)},1fr)` }}>
        {block.row.map((image) => <figure className="case-image case-image-small" key={image}>
          <img src={asset(image)} alt={`${title}, project image`} loading={counter < 3 ? 'eager' : 'lazy'} />
        </figure>)}
      </div>;
      if (block.solo) return <figure className="case-image case-image-solo" key={block.solo}>
        <img src={asset(block.solo)} alt={`${title}, project image`} loading={counter < 3 ? 'eager' : 'lazy'}
          style={{ maxWidth: `${data.meta[block.solo]?.w ?? 900}px` }} />
      </figure>;
      return <figure className="case-image" key={block.full}>
        <img src={asset(block.full)} alt={`${title}, project image`} loading={counter < 3 ? 'eager' : 'lazy'} />
      </figure>;
    })}</div>);
  };
  story.forEach((item, i) => {
    if (item.img) { run.push(item.img); return; }
    flush();
    if (item.text) out.push(<p className="case-text" key={i}>{tr(item.text, item.textDe)}</p>);
    else if (item.quote) out.push(<blockquote className="case-quote" key={i}>{item.quote}</blockquote>);
    else if (item.heading) out.push(<h2 className="case-h2" key={i}>{tr(item.heading, item.headingDe)}</h2>);
    else if (item.video) out.push(<div className="case-videos" key={i}><div className="video-grid"><VideoEmbed video={item.video} eager /></div></div>);
    else if (item.embed) out.push(<CaseEmbed item={item} tr={tr} key={i} />);
  });
  flush();
  return out;
}

function Project({ project, close }) {
  const root = useRef();
  useEffect(() => { scrollTo(0, 0); }, [project.slug]);
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.case-title > *, .case-back', { y: 30, opacity: 0, duration: .8, stagger: .07, ease: 'power3.out' });
      gsap.utils.toArray('.case-image, .case-video, .polaroid').forEach((item) => gsap.from(item, { y: 55, opacity: 0, duration: .9, scrollTrigger: { trigger: item, start: 'top 90%', once: true } }));
    }, root);
    return () => ctx.revert();
  }, [project.slug]);
  const tr = useT();
  return <main className="case" ref={root}>
    <button className="case-back" onClick={close}><ArrowLeft /> {tr('All work', 'Alle Projekte')}</button>
    <section className="case-title">
      {project.titleImage
        ? <h1 className="case-logo"><img src={asset(project.titleImage)} alt={project.title} /></h1>
        : <h1>{project.title}</h1>}
      <p className="case-description">{tr(project.description, project.descriptionDe)}</p>
    </section>
    {project.clip && <figure className="case-clip">
      <em className="clip-note">{tr('before rebranding', 'vor dem Rebranding')}</em>
      <video src={asset(project.clip.src)} poster={asset(project.clip.poster)} autoPlay muted loop playsInline preload="metadata" />
    </figure>}
    {project.polaroids && <section className="case-offline">
      <div className="case-polaroids">
        {project.polaroids.map((p) => <figure className="polaroid" key={p.img}>
          {p.print ? <div className="tee-mockup" role="img" aria-label={tr(p.caption, p.captionDe)}>
            <div className="tee-mockup-person">
              <img className="tee-mockup-model" src={asset(p.img)} alt="" loading="lazy" />
              <img className="tee-mockup-print" src={asset(p.print)} alt="" loading="lazy" />
            </div>
          </div> : <img src={asset(p.img)} alt={tr(p.caption, p.captionDe)} loading="lazy" style={p.focus ? { objectPosition: p.focus } : undefined} />}
          <figcaption>{tr(p.caption, p.captionDe)}</figcaption>
        </figure>)}
      </div>
      <h2 className="co-heading">{tr('Offline · Learning Technologies London', 'Offline · Learning Technologies London')}</h2>
      <p className="co-caption">{tr('Stand & tee — my concept and design, printed and produced with a London agency.',
        'Stand & Shirt — mein Konzept und Design, gedruckt und produziert mit einer Londoner Agentur.')}</p>
    </section>}
    {project.award && <div className="case-award">
      <em>{tr(project.award.text, project.award.textDe)}</em>
      <img src={asset(project.award.badge)} alt="Product Hunt — #1 Product of the Day" />
    </div>}
    {project.story ? <div className="case-story">{renderStory(project.story, project.title, tr)}</div> : <>
    {project.videos?.length > 0 && <section className="case-videos">
      <h2 className="case-videos-heading">{project.videos.length > 1 ? tr(`Films · ${project.videos.length}`, `Filme · ${project.videos.length}`) : 'Film'}</h2>
      <div className={`video-grid${project.videos.length > 1 ? ' video-grid-multi' : ''}`}>
        {project.videos.map((video, i) => <VideoEmbed key={video.id} video={video} eager={i < 2} />)}
      </div>
    </section>}
    <div className="case-gallery">{layoutGallery(project.images.slice(1)).map((block, b) => {
      const lazy = b < 2 ? 'eager' : 'lazy';
      if (block.row) return <div className="case-row" key={`row-${b}`} style={{ gridTemplateColumns: `repeat(${Math.min(block.row.length, 3)},1fr)` }}>
        {block.row.map((image, i) => <figure className="case-image case-image-small" key={image}>
          <img src={asset(image)} alt={`${project.title}, project image ${b + i + 1}`} loading={lazy} />
        </figure>)}
      </div>;
      if (block.solo) return <figure className="case-image case-image-solo" key={block.solo}>
        <img src={asset(block.solo)} alt={`${project.title}, project image ${b + 1}`} loading={lazy}
          style={{ maxWidth: `${data.meta[block.solo]?.w ?? 900}px` }} />
      </figure>;
      return <figure className="case-image" key={block.full}>
        <img src={asset(block.full)} alt={`${project.title}, project image ${b + 1}`} loading={lazy} />
      </figure>;
    })}</div>
    </>}
    <button className="next-button" onClick={close}>{tr('All work', 'Alle Projekte')}<ArrowDown /></button>
  </main>;
}

function Photography() {
  const root = useRef();
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => gsap.utils.toArray('.photo').forEach((photo, i) => gsap.from(photo, { opacity: 0, y: 45, duration: .7, delay: (i % 3) * .06, scrollTrigger: { trigger: photo, start: 'top 90%', once: true } })), root);
    return () => ctx.revert();
  }, []);
  const tr = useT();
  return <main className="editorial-page" ref={root}>
    <section className="page-title"><h1>{tr('Photography', 'Fotografie')}</h1></section>
    <div className="photo-grid">{data.photography.map((photo, i) => <figure key={photo} className={`photo photo-${i % 7}`}><img src={asset(photo)} alt={`Eva Przybyla photography ${i + 1}`} loading={i < 6 ? 'eager' : 'lazy'} /></figure>)}</div>
  </main>;
}

function About() {
  const tr = useT();
  return <main className="about-page">
    <section className="about-hero"><div><p className="lead">{tr(
      'I combine brand strategy, creative leadership and technical understanding to turn audience insight into distinctive brands, campaigns and product launches.',
      'Ich verbinde Markenstrategie, kreative Führung und technisches Verständnis, um aus Audience-Insights unverwechselbare Marken, Kampagnen und Produkt-Launches zu machen.')}</p></div><img src={asset(data.aboutImage)} alt="Eva Przybyla" /></section>
    <section className="about-copy">
      <p className="lead">{tr(
        'I always thought my calling was to be a writer. But I couldn’t let go of images. So I learned to combine the two, telling stories through words, visuals and the relationship between them.',
        'Ich dachte immer, meine Berufung sei das Schreiben. Aber ich konnte die Bilder nicht loslassen. Also habe ich gelernt, beides zu verbinden — Geschichten zu erzählen durch Worte, Bilder und die Beziehung zwischen ihnen.')}</p>
      <div>
        <p>{tr(
          'That took me to leading international advertising agencies — the door opened when I won a one-day creative competition, coming up with a concept for Heineken in a single day and beating 400 Dutch creatives. At TBWA, DDB and OLIVER (Unilever’s in-house marketing agency), I developed campaign concepts, helped win accounts and directed multidisciplinary teams across markets. I worked with brands including adidas, McDonald’s, KitKat, Mercedes-Benz, TeamNL, Lipton, Magnum, Cornetto, Reebok and Wall’s.',
          'Das führte mich zu führenden internationalen Werbeagenturen — die Tür öffnete sich, als ich einen eintägigen Kreativwettbewerb gewann: ein Konzept für Heineken an einem einzigen Tag, gegen 400 niederländische Kreative. Bei TBWA, DDB und OLIVER (Unilevers Inhouse-Marketingagentur) entwickelte ich Kampagnenkonzepte, half, Etats zu gewinnen, und leitete multidisziplinäre Teams über Märkte hinweg. Ich arbeitete mit Marken wie adidas, McDonald’s, KitKat, Mercedes-Benz, TeamNL, Lipton, Magnum, Cornetto, Reebok und Wall’s.')}</p>
        <p>{tr(
          'Over a decade, I learned how to turn audience insight into a clear strategic direction, bring people behind an idea and carry it through production. My work involved aligning clients, strategists, designers, writers, filmmakers and developers, including directing teams across India, Kuala Lumpur and South Africa.',
          'In über einem Jahrzehnt habe ich gelernt, Audience-Insights in eine klare strategische Richtung zu übersetzen, Menschen hinter einer Idee zu versammeln und sie durch die Produktion zu tragen. Dazu gehörte, Kunden, Strategen, Designer, Texter, Filmemacher und Entwickler aufeinander abzustimmen — einschließlich der Leitung von Teams in Indien, Kuala Lumpur und Südafrika.')}</p>
        <p>{tr(
          'Along the way, the work earned recognition. TeamNL’s “Zo Doen We Dat!” campaign received praise from Effie Netherlands for its art direction and strong visual brand expression. My campaign for Wall’s “Ice Cream Slime” earned a Unilever Global Silver award. For Dobbi I worked on both the app and the launch campaign; the service went on to be named a top-5 Disrupter in the Netherlands at the 2019 Dutch Interactive Awards.',
          'Unterwegs wurde die Arbeit ausgezeichnet. TeamNLs Kampagne „Zo Doen We Dat!“ erhielt Lob von Effie Netherlands für ihre Art Direction und starke visuelle Markensprache. Meine Kampagne für Wall’s „Ice Cream Slime“ gewann einen Unilever Global Silver Award. Für Dobbi arbeitete ich an der App und an der Launch-Kampagne; der Service wurde bei den Dutch Interactive Awards 2019 als Top-5-Disrupter der Niederlande ausgezeichnet.')}</p>
        <p>{tr(
          'My creative background also includes a Print shortlist in Poland’s Young Creatives competition for Cannes Young Lions, a shared Siemens Future Living distinction for an architectural design concept, first place with my team in a short-film competition in London, and second place in a Focus magazine advertising competition.',
          'Zu meinem kreativen Hintergrund gehören außerdem eine Print-Shortlist bei Polens Young-Creatives-Wettbewerb für die Cannes Young Lions, eine geteilte Siemens-Future-Living-Auszeichnung für ein Architekturkonzept, der erste Platz mit meinem Team bei einem Kurzfilmwettbewerb in London und der zweite Platz bei einem Werbewettbewerb des Focus-Magazins.')}</p>
        <p>{tr(
          'I hold two master’s degrees: in Visual Communication from Poland’s prestigious Academy of Fine Arts and Design in Wrocław, and in Graphic Moving Image — focused on advertising and branding — from University of the Arts London (London College of Communication).',
          'Ich habe zwei Masterabschlüsse: in Visueller Kommunikation von Polens renommierter Akademie der Bildenden Künste in Wrocław und in Graphic Moving Image — mit Fokus auf Werbung und Branding — von der University of the Arts London (London College of Communication).')}</p>
      </div>
    </section>
    <section className="about-copy">
      <p className="lead">{tr(
        'Curiosity about how products work took me to 42 Lausanne, where I completed the intensive software-engineering common core over two years. Programming sharpened my analytical thinking and gave me another way to bring ideas to life.',
        'Die Neugier, wie Produkte funktionieren, führte mich ans 42 Lausanne, wo ich in zwei Jahren den intensiven Software-Engineering-Core abschloss. Programmieren hat mein analytisches Denken geschärft und mir einen weiteren Weg gegeben, Ideen zum Leben zu erwecken.')}</p>
      <div>
        <p>{tr(
          'Today, I can question technical assumptions, work closely with engineers and build tools myself. I developed a content studio that lets anyone on my team generate branded assets and content on demand, turning brand guidelines into something people can actually use.',
          'Heute kann ich technische Annahmen hinterfragen, eng mit Engineers zusammenarbeiten und selbst Tools bauen. Ich habe ein Content-Studio entwickelt, mit dem jede und jeder im Team markenkonforme Assets und Inhalte auf Abruf erstellen kann — Brand Guidelines werden so zu etwas, das Menschen wirklich nutzen.')}</p>
        <p>{tr(
          'I also built a marketing platform that connects our big ideas, goals, campaigns and ideal customer profiles with performance metrics and audience insights. It gives the team a shared view of what we’re trying to achieve, what’s working and what we’re learning, helping us make better decisions about where to focus next.',
          'Außerdem habe ich eine Marketing-Plattform gebaut, die unsere großen Ideen, Ziele, Kampagnen und Ideal Customer Profiles mit Performance-Metriken und Audience-Insights verbindet. Sie gibt dem Team einen gemeinsamen Blick darauf, was wir erreichen wollen, was funktioniert und was wir lernen — und hilft uns, besser zu entscheiden, worauf wir uns als Nächstes konzentrieren.')}</p>
        <p>{tr(
          'At Scholé AI, I bring these disciplines together in a broad marketing role. I’ve led rebranding, developed positioning and integrated campaigns, and planned advertising budgets. My work connects landing pages, email automation and marketing funnels with sales decks and pitch narratives, giving each stage of the customer journey a clear purpose.',
          'Bei Scholé AI bringe ich diese Disziplinen in einer breiten Marketingrolle zusammen. Ich habe das Rebranding geleitet, Positionierung und integrierte Kampagnen entwickelt und Werbebudgets geplant. Meine Arbeit verbindet Landingpages, E-Mail-Automatisierung und Marketing-Funnels mit Sales-Decks und Pitch-Narrativen — jede Stufe der Customer Journey bekommt einen klaren Zweck.')}</p>
        <p>{tr(
          <>I led two product launches, including Scholé’s debut on Product Hunt, which earned <strong>#1 Product of the Day</strong>, ranking ahead of Microsoft Copilot Health, YouTube TV Custom Multiview and Cloud Computer by Manus on 2 May 2026.</>,
          <>Ich habe zwei Produkt-Launches geleitet, darunter Scholés Debüt auf Product Hunt — <strong>#1 Product of the Day</strong> am 2. Mai 2026, vor Microsoft Copilot Health, YouTube TV Custom Multiview und Cloud Computer von Manus.</>)}</p>
        <p>{tr(
          'Working directly with founders, product and engineering, I also help improve onboarding and the platform experience, using feedback and performance data to guide decisions. I’ve directed creative execution, designed event booths and represented the company at industry events.',
          'In direkter Zusammenarbeit mit Foundern, Produkt und Engineering helfe ich außerdem, Onboarding und Plattform-Erlebnis zu verbessern — auf Basis von Feedback und Performance-Daten. Ich habe die kreative Umsetzung geleitet, Messestände gestaltet und das Unternehmen auf Branchen-Events vertreten.')}</p>
        <p>{tr(
          'I bring the experience to set direction and the practical understanding to deliver it. I connect positioning, people, budgets and execution, taking responsibility for the decisions that shape the work and using results to decide what comes next.',
          'Ich bringe die Erfahrung mit, Richtung vorzugeben, und das praktische Verständnis, sie umzusetzen. Ich verbinde Positionierung, Menschen, Budgets und Umsetzung — übernehme Verantwortung für die Entscheidungen, die die Arbeit prägen, und nutze Ergebnisse, um zu entscheiden, was als Nächstes kommt.')}</p>
        <p><strong>{tr(
          'Based in Switzerland.',
          'Wohnhaft in der Schweiz.')}</strong></p>
      </div>
    </section>
    <div className="case-polaroids about-polaroids">
      {[
        // pinned in four rows — 5 / 5 / 5 / 6
        [
          ['04', 'still slightly excited by mountains', 'Berge begeistern mich immer noch', 'rotate(-2.6deg) translateY(4px)'],
          ['09', 'new pens', 'neue Stifte', 'rotate(1.4deg) translateY(-6px)'],
          ['01', 'sliding into Feb', 'in den Februar gerutscht', 'rotate(3.1deg) translateY(8px)'],
          ['12', 'shot while shooting', 'fotografiert beim Fotografieren', 'rotate(-1.8deg) translateY(-3px)'],
          ['06', 'Aiguille du Midi, good morning', 'Aiguille du Midi, guten Morgen', 'rotate(2.2deg) translateY(-9px)'],
        ],
        [
          ['13', '30 years of training', '30 Jahre Training', 'rotate(-3.4deg) translateY(5px)'],
          ['08', 'morning meditation', 'Morgenmeditation', 'rotate(-0.9deg) translateY(12px)'],
          ['02', 'hey, what is out there?', 'hey, was ist da draußen?', 'rotate(2.7deg) translateY(-4px)'],
          ['10', 'art school days', 'Kunsthochschul-Zeiten', 'rotate(1.1deg) translateY(6px)'],
          ['05', 'morning routine', 'Morgenroutine', 'rotate(-2.9deg) translateY(-7px)'],
        ],
        [
          ['14', 'Chamonix mornings', 'Chamonix-Morgen', 'rotate(3.6deg) translateY(3px)'],
          ['03', 'almost landed it', 'fast gestanden', 'rotate(-1.5deg) translateY(10px)'],
          ['15', 'landed it this time', 'diesmal gestanden', 'rotate(-2.3deg) translateY(7px)'],
          ['11', 'still painting', 'immer noch am Malen', 'rotate(-3.1deg) translateY(-5px)'],
          ['07', 'back in my mountain paradise', 'zurück in meinem Bergparadies', 'rotate(2deg) translateY(-11px)'],
        ],
        [
          ['17', 'board meeting', 'Board-Meeting', 'rotate(-2.1deg) translateY(6px)'],
          ['19', 'is it a bird', 'ist es ein Vogel', 'rotate(2.8deg) translateY(-8px)'],
          ['16', 'hello', 'hallo', 'rotate(-1.2deg) translateY(9px)'],
          ['21', 'bowl for lunch', 'Bowl zum Lunch', 'rotate(3.2deg) translateY(-4px)'],
          ['18', 'whatever it takes', 'koste es, was es wolle', 'rotate(-3deg) translateY(5px)'],
          ['20', 'downhill days', 'Downhill-Tage', 'rotate(1.6deg) translateY(-10px)'],
        ],
      ].map((row, ri) => <React.Fragment key={ri}>
        {ri > 0 && <span className="polaroid-break" aria-hidden="true" />}
        {row.map(([n, caption, captionDe, tilt]) => <figure className="polaroid" key={n} style={{ transform: tilt }}>
          <img src={asset(`/media/about-life-${n}.webp`)} alt={tr(caption, captionDe)} loading="lazy" />
          <figcaption>{tr(caption, captionDe)}</figcaption>
        </figure>)}
      </React.Fragment>)}
    </div>
    <section className="contact"><a href="mailto:whatevacreates@gmail.com"><HoloMesh /><span className="contact-ink">{tr('Let’s make something that works.', 'Lass uns etwas machen, das funktioniert.')} <ArrowUpRight /></span></a><div><a href="tel:+41782154258">+41 78 215 42 58</a><a href="mailto:whatevacreates@gmail.com">whatevacreates@gmail.com</a></div></section>
  </main>;
}

// the footer wears the same live hologram as the hero panel and reel tile,
// with the site's slate ink on top
function Footer() {
  const tr = useT();
  return <footer><HoloMesh /><span>© {new Date().getFullYear()} Eva Przybyla</span><span className="footer-claim">Ideas that sell. Brand strategy. Creative direction. Growth marketing. Design.</span><a href="mailto:whatevacreates@gmail.com">{tr('Let’s talk', 'Lass uns reden')} <ArrowUpRight /></a></footer>;
}

function App() {
  const [route, setRoute] = useState(() => location.hash.slice(1) || 'work');
  const [lang, setLangState] = useState(getLang);
  const setLang = (next) => { setLangState(next); saveLang(next); document.documentElement.lang = next; };
  useEffect(() => {
    document.documentElement.lang = lang;
    const update = () => setRoute(location.hash.slice(1) || 'work');
    addEventListener('hashchange', update); return () => removeEventListener('hashchange', update);
  }, []);
  const navigate = (page) => { location.hash = page; scrollTo(0, 0); };
  const project = route.startsWith('project/') ? data.projects.find((item) => item.slug === route.split('/')[1]) : null;
  const post = route.startsWith('blog/') ? posts.find((item) => item.slug === route.split('/')[1]) : null;
  const page = project ? 'work' : post ? 'blog' : route;
  return <LangContext.Provider value={lang}><Header page={page} navigate={navigate} lang={lang} setLang={setLang} />{project ? <Project project={project} close={() => navigate('work')} /> : post ? <BlogPost post={post} close={() => navigate('blog')} /> : route === 'photography' ? <Photography /> : route === 'blog' ? <Blog openPost={(slug) => navigate(`blog/${slug}`)} /> : route === 'about' ? <About /> : <Work openProject={(slug) => navigate(`project/${slug}`)} />}<Footer /></LangContext.Provider>;
}

createRoot(document.getElementById('root')).render(<App />);
