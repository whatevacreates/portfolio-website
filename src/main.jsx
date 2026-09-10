import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowLeft, ArrowUpRight, Menu, Play, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Opening from './opening.jsx';
import data from './portfolio-data.json';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

// media lives in public/media and is referenced as "/media/..." in the data.
// BASE_URL-relative resolution keeps those URLs working when the site is
// hosted under a subpath (e.g. GitHub Pages project sites).
const asset = (p) => import.meta.env.BASE_URL + p.replace(/^\//, '');

const nav = [
  ['work', 'Work'],
  ['photography', 'Photography'],
  ['about', 'About']
];

function Header({ page, navigate }) {
  const [open, setOpen] = useState(false);
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
      {nav.map(([key, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => go(key)}>{label}</button>)}
    </nav>
  </header>;
}

// only the gifs — no headings, no cards, no counters. each one quietly
// opens its project.
const reels = [
  ['/media/team-nl-01-zo-doen-we-dat3.webp', 'team-nl'],
  ['/media/reebok-01-go-elemental-xx.webp', 'reebok'],
  ['/media/mcwalk-01-mcwalk.webp', 'mcwalk'],
  ['/media/adidas-ub-01-adidas-product-video-icons.webp', 'adidas-ub'],
];

function Work({ openProject }) {
  const root = useRef();
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
    <Opening />
    <section className="reel">
      {reels.map(([src, slug], i) => <button className="reel-item" key={src} onClick={() => openProject(slug)} aria-label="View project">
        <img src={asset(src)} alt="" loading={i < 2 ? 'eager' : 'lazy'} />
      </button>)}
      <p className="reel-wit">Ideas are cheap. This site cost exactly one.</p>
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
    if (meta && (meta.animated || meta.w < SMALL_WIDTH)) run.push(image);
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
    <figcaption>{video.title}</figcaption>
  </figure>;
}

// story-driven case pages: text, quotes and films interleaved with the
// imagery, in the order the original whatevacreates.com page tells it.
// consecutive images run through the same size-aware gallery layout.
function renderStory(story, title) {
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
    if (item.text) out.push(<p className="case-text" key={i}>{item.text}</p>);
    else if (item.quote) out.push(<blockquote className="case-quote" key={i}>{item.quote}</blockquote>);
    else if (item.heading) out.push(<h2 className="case-h2" key={i}>{item.heading}</h2>);
    else if (item.video) out.push(<div className="case-videos" key={i}><div className="video-grid"><VideoEmbed video={item.video} eager /></div></div>);
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
      gsap.utils.toArray('.case-image, .case-video').forEach((item) => gsap.from(item, { y: 55, opacity: 0, duration: .9, scrollTrigger: { trigger: item, start: 'top 90%', once: true } }));
    }, root);
    return () => ctx.revert();
  }, [project.slug]);
  return <main className="case" ref={root}>
    <button className="case-back" onClick={close}><ArrowLeft /> All work</button>
    <section className="case-title">
      <p>{project.client} · {project.category}</p>
      <h1>{project.title}</h1>
      <p className="case-description">{project.description}</p>
    </section>
    {project.story ? <div className="case-story">{renderStory(project.story, project.title)}</div> : <>
    {project.videos?.length > 0 && <section className="case-videos">
      <h2 className="case-videos-heading">{project.videos.length > 1 ? `Films · ${project.videos.length}` : 'Film'}</h2>
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
    <button className="next-button" onClick={close}>All work<ArrowDown /></button>
  </main>;
}

function Photography() {
  const root = useRef();
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => gsap.utils.toArray('.photo').forEach((photo, i) => gsap.from(photo, { opacity: 0, y: 45, duration: .7, delay: (i % 3) * .06, scrollTrigger: { trigger: photo, start: 'top 90%', once: true } })), root);
    return () => ctx.revert();
  }, []);
  return <main className="editorial-page" ref={root}>
    <section className="page-title"><p>Personal archive · Observations</p><h1>Photography</h1><span>A selection of places, people and quiet in-between moments.</span></section>
    <div className="photo-grid">{data.photography.map((photo, i) => <figure key={photo} className={`photo photo-${i % 7}`}><img src={asset(photo)} alt={`Eva Przybyla photography ${i + 1}`} loading={i < 6 ? 'eager' : 'lazy'} /></figure>)}</div>
  </main>;
}

function About() {
  return <main className="about-page">
    <section className="about-hero"><div><p className="lead">I combine brand strategy, creative leadership and technical understanding to turn audience insight into distinctive brands, campaigns and product launches.</p></div><img src={asset(data.aboutImage)} alt="Eva Przybyla" /></section>
    <section className="about-copy">
      <p className="lead">I always thought my calling was to be a writer. But I couldn’t let go of images. So I learned to combine the two, telling stories through words, visuals and the relationship between them.</p>
      <div>
        <p>That took me to leading international advertising agencies, including TBWA, DDB and OLIVER, where I developed campaign concepts, helped win accounts and directed multidisciplinary teams across markets. I worked with brands including adidas, McDonald’s, KitKat, Mercedes-Benz, TeamNL, Lipton, Magnum, Cornetto, Reebok and Wall’s.</p>
        <p>Over a decade, I learned how to turn audience insight into a clear strategic direction, bring people behind an idea and carry it through production. My work involved aligning clients, strategists, designers, writers, filmmakers and developers, including directing teams across India, Kuala Lumpur and South Africa.</p>
        <p>Along the way, the work earned recognition. TeamNL’s “Zo Doen We Dat!” campaign received praise from Effie Netherlands for its art direction and strong visual brand expression. My campaign for Wall’s “Ice Cream Slime” earned a Unilever Global Silver award. I also supervised work on Dobbi’s app and contributed to its integrated launch; the business was named the world’s most innovative dry cleaner by CINET in 2018.</p>
        <p>My creative background also includes a Print shortlist in Poland’s Young Creatives competition for Cannes Young Lions, a shared Siemens Future Living distinction for an architectural design concept, first place with my team in a short-film competition in London, and second place in a Focus magazine advertising competition.</p>
      </div>
    </section>
    <section className="about-copy">
      <p className="lead">Curiosity about how products work took me to 42 Lausanne, where I completed the intensive software-engineering common core over two years. Programming sharpened my analytical thinking and gave me another way to bring ideas to life.</p>
      <div>
        <p>Today, I can question technical assumptions, work closely with engineers and build tools myself. I developed a content studio that lets anyone on my team generate branded assets and content on demand, turning brand guidelines into something people can actually use.</p>
        <p>I also built a marketing platform that connects our big ideas, goals, campaigns and ideal customer profiles with performance metrics and audience insights. It gives the team a shared view of what we’re trying to achieve, what’s working and what we’re learning, helping us make better decisions about where to focus next.</p>
        <p>At Scholé AI, I bring these disciplines together in a broad marketing role. I’ve led rebranding, developed positioning and integrated campaigns, and planned advertising budgets. My work connects landing pages, email automation and marketing funnels with sales decks and pitch narratives, giving each stage of the customer journey a clear purpose.</p>
        <p>I led two product launches, including Scholé’s debut on Product Hunt, which earned <strong>#1 Product of the Day</strong>, ranking ahead of Microsoft Copilot Health, YouTube TV Custom Multiview and Cloud Computer by Manus on 2 May 2026.</p>
        <p>Working directly with founders, product and engineering, I also help improve onboarding and the platform experience, using feedback and performance data to guide decisions. I’ve contributed to hiring two team members, directed creative execution, designed event booths and represented the company at industry events.</p>
        <p>I bring the experience to set direction and the practical understanding to deliver it. I connect positioning, people, budgets and execution, taking responsibility for the decisions that shape the work and using results to decide what comes next.</p>
        <p><strong>Based in Switzerland. Open to marketing lead and senior marketing opportunities.</strong></p>
      </div>
    </section>
    <section className="contact"><p>Have a project, role or idea in mind?</p><a href="mailto:whatevacreates@gmail.com">Let’s make something great <ArrowUpRight /></a><div><a href="tel:+41782154258">+41 78 215 42 58</a><a href="mailto:whatevacreates@gmail.com">whatevacreates@gmail.com</a></div></section>
  </main>;
}

function Footer() { return <footer><span>© {new Date().getFullYear()} Eva Przybyla</span><span>Design · Direction · Development</span><a href="mailto:whatevacreates@gmail.com">Start a conversation ↗</a></footer>; }

function App() {
  const [route, setRoute] = useState(() => location.hash.slice(1) || 'work');
  useEffect(() => {
    const update = () => setRoute(location.hash.slice(1) || 'work');
    addEventListener('hashchange', update); return () => removeEventListener('hashchange', update);
  }, []);
  const navigate = (page) => { location.hash = page; scrollTo(0, 0); };
  const project = route.startsWith('project/') ? data.projects.find((item) => item.slug === route.split('/')[1]) : null;
  const page = project ? 'work' : route;
  return <><Header page={page} navigate={navigate} />{project ? <Project project={project} close={() => navigate('work')} /> : route === 'photography' ? <Photography /> : route === 'about' ? <About /> : <Work openProject={(slug) => navigate(`project/${slug}`)} />}<Footer /></>;
}

createRoot(document.getElementById('root')).render(<App />);
