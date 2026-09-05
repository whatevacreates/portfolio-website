import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowLeft, ArrowUpRight, Menu, Play, X } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Opening from './opening.jsx';
import data from './portfolio-data.json';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

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
      <span>Art Director · Designer · Developer</span>
    </button>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
      {open ? <X /> : <Menu />}
    </button>
    <nav className={open ? 'open' : ''} aria-label="Primary navigation">
      {nav.map(([key, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => go(key)}>{label}</button>)}
    </nav>
  </header>;
}

function Intro() {
  const root = useRef();
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.intro-kicker, .intro h1 span, .intro-foot > *', { y: 45, opacity: 0, duration: 1, stagger: .08, ease: 'power3.out' });
    }, root);
    return () => ctx.revert();
  }, []);
  return <section className="intro" ref={root}>
    <p className="intro-kicker">Independent creative · Lausanne, Switzerland</p>
    <h1><span>Ideas with</span><span>character, built</span><span>to move people.</span></h1>
    <div className="intro-foot">
      <p>Creating human-centered brand worlds, campaigns and digital experiences with a decade of art direction behind them.</p>
      <span className="scroll-cue">Scroll to explore <i>↓</i></span>
    </div>
  </section>;
}

function Work({ openProject }) {
  const root = useRef();
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.project-card').forEach((card) => gsap.from(card, {
        y: 70, opacity: 0, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 88%', once: true }
      }));
    }, root);
    return () => ctx.revert();
  }, []);
  return <main ref={root}>
    <Opening />
    <section className="work-heading"><p>Selected work</p><span>{data.projects.length} projects · 2016—2025</span></section>
    <div className="project-grid">
      {data.projects.map((project, index) => <button className="project-card" key={project.slug} onClick={() => openProject(project.slug)}>
        <div className="project-image"><img src={project.images[0]} alt="" loading={index < 4 ? 'eager' : 'lazy'} /><span className="project-number">{String(index + 1).padStart(2, '0')}</span><span className="view-project">View project<ArrowUpRight /></span></div>
        <div className="project-meta"><h2>{project.title}</h2><p>{project.client} · {project.category}</p></div>
      </button>)}
    </div>
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
          <img src={video.poster} alt="" loading={eager ? 'eager' : 'lazy'} />
          <span className="video-play"><Play /></span>
        </button>}
    <figcaption>{video.title}</figcaption>
  </figure>;
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
          <img src={image} alt={`${project.title}, project image ${b + i + 1}`} loading={lazy} />
        </figure>)}
      </div>;
      if (block.solo) return <figure className="case-image case-image-solo" key={block.solo}>
        <img src={block.solo} alt={`${project.title}, project image ${b + 1}`} loading={lazy}
          style={{ maxWidth: `${data.meta[block.solo]?.w ?? 900}px` }} />
      </figure>;
      return <figure className="case-image" key={block.full}>
        <img src={block.full} alt={`${project.title}, project image ${b + 1}`} loading={lazy} />
      </figure>;
    })}</div>
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
    <div className="photo-grid">{data.photography.map((photo, i) => <figure key={photo} className={`photo photo-${i % 7}`}><img src={photo} alt={`Eva Przybyla photography ${i + 1}`} loading={i < 6 ? 'eager' : 'lazy'} /></figure>)}</div>
  </main>;
}

function About() {
  return <main className="about-page">
    <section className="about-hero"><div><p>About · Contact</p><h1>Designer’s eye.<br/>Developer’s mind.</h1></div><img src={data.aboutImage} alt="Eva Przybyla" /></section>
    <section className="about-copy">
      <p className="lead">I create things that work for real people — from brand campaigns and visual identities to thoughtful digital experiences.</p>
      <div><p>I learned human-centered design through years of prototyping, testing and refining at the E. Geppert Academy of Fine Arts and London College of Communication. That approach stayed with me while creating for adidas, Reebok, McDonald’s and many more.</p><p>Now I’m expanding the technical side at 42 Lausanne, bringing design and development together to make digital experiences feel effortless. I love a good idea, sharp craft and code that makes both come alive.</p></div>
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
