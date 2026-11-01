/* America.gov-inspired progressive motion. No framework or animation dependency. */
(function () {
  'use strict';
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  /* No menu on this page: the header is the logo alone. */

  /* The globe stands for everything a person might learn here, so it mixes
     subjects rather than repeating one track. */
  var artNames = ['ScalingLaws', 'ModelContextProtocolMCP', 'OpenClawAndAgenticAISecurity', 'AgentHarnesses', 'LongHorizonTasks', 'Agents', 'ContextEngineering', 'InferenceArchitecture', 'EthicalAI'];
  var orbit = document.getElementById('lesson-orbit');
  var fragment = document.createDocumentFragment();
  for (var i = 0; i < 36; i++) {
    var y = 1 - 2 * (i + 0.5) / 36;
    var angle = i * Math.PI * (3 - Math.sqrt(5));
    var ring = Math.sqrt(1 - y * y);
    var x = Math.cos(angle) * ring, z = Math.sin(angle) * ring;
    var tile = document.createElement('div');
    tile.className = 'orbit-tile';
    tile.style.transform = 'translate3d(' + x * 155 + 'px,' + y * 155 + 'px,' + z * 155 + 'px) rotateY(' + Math.atan2(x, z) * 180 / Math.PI + 'deg) rotateX(' + -Math.asin(y) * 180 / Math.PI + 'deg)';
    var img = document.createElement('img');
    img.src = 'assets/lessons/' + artNames[i % artNames.length] + '.svg';
    img.alt = ''; img.loading = 'lazy';
    tile.appendChild(img); fragment.appendChild(tile);
  }
  orbit.appendChild(fragment);

  document.querySelectorAll('[data-words]').forEach(function (part) {
    var words = part.textContent.trim().split(/\s+/);
    part.textContent = '';
    words.forEach(function (word, index) {
      var span = document.createElement('span');
      span.className = 'word'; span.textContent = word;
      part.appendChild(span);
      if (index < words.length - 1) part.appendChild(document.createTextNode(' '));
    });
  });
  document.querySelectorAll('.word').forEach(function (word, index) { word.style.setProperty('--word-delay', index * 0.035 + 's'); });
  var revealTargets = document.querySelectorAll('[data-reveal], [data-manifesto]');
  if ('IntersectionObserver' in window && !motionQuery.matches) {
    document.body.classList.add('has-motion');
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    revealTargets.forEach(function (target) { reveal.observe(target); });
  }
  if ('IntersectionObserver' in window) {
    var panels = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { entry.target.classList.toggle('is-offscreen', !entry.isIntersecting); });
    });
    document.querySelectorAll('[data-animated-panel]').forEach(function (panel) { panels.observe(panel); });
  }
  function finishMotion() { if (motionQuery.matches) document.body.classList.remove('has-motion'); }
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', finishMotion);

  var dock = document.getElementById('floating-bar');
  var hero = document.querySelector('.hero');
  var dockQueued = false;
  var foot = document.querySelector('.foot');
  var offer = document.getElementById('offer');
  /* Hidden over the hero and its button, over the offer and its price, and over the close, so it never covers a CTA, the price or the wordmark. */
  function updateDock() {
    var offerBox = offer && offer.getBoundingClientRect();
    dock.hidden = hero.getBoundingClientRect().bottom > 80 ||
      (offerBox && offerBox.top < innerHeight - 40 && offerBox.bottom > 0) ||
      (foot && foot.getBoundingClientRect().top < innerHeight - 40);
    dockQueued = false;
  }
  window.addEventListener('scroll', function () {
    if (!dockQueued) { dockQueued = true; requestAnimationFrame(updateDock); }
  }, { passive: true });
  window.addEventListener('resize', updateDock);
  window.addEventListener('pageshow', updateDock);
  updateDock();
})();

/* The offer: analytics, the countdown, the checkout links and the video. */
(function () {
  'use strict';

  var CONFIG = window.JOIN_CONFIG || {};
  var SECOND = 1000;
  var MINUTE = 60 * SECOND;
  var HOUR = 60 * MINUTE;
  var DAY = 24 * HOUR;

  /* ---------- PostHog (same project as the other try.schole.ai landings) ---------- */
  var KEY = 'phc_dNFSfw3l9oqvM5S2vWX0hnEJTG5jID4hEH3pmY4n7A4';
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  try { posthog.init(KEY, { api_host: 'https://eu.i.posthog.com' }); } catch (e) {}

  function track(name, props, options) {
    try { posthog.capture(name, Object.assign({ page: 'your-path-forward-landing' }, props || {}), options); } catch (e) {}
  }
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-ph]');
    if (!el) return;
    /* data-ph-cta-location adds cta_location; a same-tab link sends by beacon so the event survives the navigation. */
    var where = el.getAttribute('data-ph-cta-location');
    track(el.getAttribute('data-ph'), where ? { cta_location: where } : null, where ? { transport: 'sendBeacon' } : undefined);
  });

  /* The link to the strategy session carries this visit's source along, so the
     session page can still attribute it. */
  var consultLink = document.querySelector('.consult-link');
  if (consultLink) {
    try {
      var here = new URLSearchParams(location.search);
      var target = new URL(consultLink.getAttribute('href'), location.href);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'li_fat_id', 'rdt_cid'].forEach(function (key) {
        if (here.get(key)) target.searchParams.set(key, here.get(key));
      });
      consultLink.href = target.pathname + target.search;
    } catch (e) {}
  }

  /* ---------- Countdown ----------
     The deadline rolls: it is the next cycleAnchor + n * cycleDays that is
     still in the future, so the offer closes every few days and reopens
     without anyone editing a date. */
  var countdown = document.getElementById('countdown');
  var deadlineText = document.getElementById('deadline-text');

  function nextDeadline() {
    var anchor = new Date(CONFIG.cycleAnchor || '').getTime();
    var period = (CONFIG.cycleDays || 3) * DAY;
    if (isNaN(anchor) || period <= 0) return NaN;
    var elapsed = Date.now() - anchor;
    if (elapsed < 0) return anchor;
    return anchor + (Math.floor(elapsed / period) + 1) * period;
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function renderCountdown() {
    var endsAt = nextDeadline();
    if (isNaN(endsAt)) { countdown.textContent = 'Ends soon'; return; }
    var left = endsAt - Date.now();
    /* A rolling window never reaches zero: the next deadline takes over. */
    if (left <= 0) { left = 0; }
    var days = Math.floor(left / DAY);
    var hours = Math.floor((left % DAY) / HOUR);
    var mins = Math.floor((left % HOUR) / MINUTE);
    var secs = Math.floor((left % MINUTE) / SECOND);
    countdown.textContent = (days > 0 ? days + 'd ' : '') + pad(hours) + 'h ' + pad(mins) + 'm ' + pad(secs) + 's left';
    if (deadlineText) {
      deadlineText.textContent = 'on ' + new Date(endsAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
    }
  }

  if (countdown) {
    renderCountdown();
    window.setInterval(renderCountdown, SECOND);
  }

  /* ---------- Checkout ----------
     Every call to action opens the Stripe payment link, which prefills the
     promo code, so the price on the page is the price at checkout. The href
     in the markup is the same link, so the buttons work before this runs and
     without JavaScript at all. */
  var checkoutUrl = CONFIG.checkoutUrl;
  if (checkoutUrl) {
    document.querySelectorAll('[data-checkout]').forEach(function (link) {
      link.href = checkoutUrl;
      link.target = '_blank';
      link.rel = 'noopener';
    });
  }

  /* ---------- VSL box ---------- */
  var VSL_ID = 'uQ5nrIQ0dsY';
  var VSL_BASE = 'https://www.youtube-nocookie.com/embed/' + VSL_ID + '?rel=0&playsinline=1&cc_load_policy=1&iv_load_policy=3&modestbranding=1';
  var PREVIEW = VSL_BASE + '&autoplay=1&mute=1&controls=0&disablekb=1&loop=1&playlist=' + VSL_ID;
  var SOUND = VSL_BASE + '&autoplay=1&mute=0&controls=1&start=0';
  var vsl = document.getElementById('vsl');
  var frame = document.getElementById('vsl-frame');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reduced motion: no silent autoplay, the first frame waits behind the pill. */
  frame.src = reduced ? VSL_BASE + '&controls=0' : PREVIEW;
  document.getElementById('vsl-sound').addEventListener('click', function () {
    frame.src = SOUND;
    vsl.classList.remove('is-preview');
    vsl.classList.add('is-sound');
  });
})();

/* The scenario panel: a short run of questions where each answer has a
   consequence and feeds the next one. */
(function () {
  'use strict';

  /* ---------- Role examples ---------- */
  var roleExamples = {
    ceo: 'Learning agents, your tutor starts from the board pack you review every month, and builds up to an agent that drafts it.',
    hr: 'Learning agents, your tutor starts from the onboarding questions your team answers every week, and builds up to an agent that answers them.',
    ops: 'Learning agents, your tutor starts from the status report you chase across five teams every Friday, and builds up to an agent that compiles it.'
  };
  document.querySelectorAll('[data-role]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-role]').forEach(function (option) {
        var active = option === button;
        option.classList.toggle('is-active', active);
        option.setAttribute('aria-pressed', String(active));
      });
      document.getElementById('role-example').textContent = roleExamples[button.dataset.role];
    });
  });

  /* ---------- Scenario ---------- */
  var STEPS = [
    {
      setup: 'Your board wants the themes from 40 customer calls by tomorrow morning.',
      question: 'What is your first move?',
      options: [
        { label: 'Paste all 40 transcripts in at once', good: false, feedback: 'The model loses the thread across that much text and gives you averages. Work in batches so you can check each one.' },
        { label: 'Run ten at a time and check each batch', good: true, feedback: 'Right. Smaller batches mean you can still tell whether the summary matches what was actually said.' }
      ]
    },
    {
      setup: 'The first batch comes back with five themes. One of them surprises you.',
      question: 'What do you do with the surprising one?',
      options: [
        { label: 'Ask which calls it came from', good: true, feedback: 'Right. A theme you cannot trace back to specific calls is not yet a finding.' },
        { label: 'Drop it, it is probably noise', good: false, feedback: 'The surprising theme is often the useful one. Trace it before you decide.' }
      ]
    },
    {
      setup: 'You have five themes, each tied to the calls behind it.',
      question: 'What goes in the message to your board?',
      options: [
        { label: 'The five themes and the quotes behind them', good: true, feedback: 'Right. The quotes are what make it checkable by someone who was not on the calls.' },
        { label: 'The summary, since they asked for themes', good: false, feedback: 'Without the quotes your board has to take it on trust, and cannot act on any of it in a meeting.' }
      ]
    }
  ];

  var scenario = {
    index: 0,
    setup: document.getElementById('scenario-setup'),
    question: document.getElementById('scenario-question'),
    options: document.getElementById('scenario-options'),
    feedback: document.getElementById('scenario-feedback'),
    next: document.getElementById('scenario-next'),
    progress: document.getElementById('scenario-progress')
  };

  function renderScenario() {
    var step = STEPS[scenario.index];
    scenario.progress.textContent = 'Step ' + (scenario.index + 1) + ' of ' + STEPS.length;
    scenario.setup.textContent = step.setup;
    scenario.question.textContent = step.question;
    scenario.feedback.textContent = '';
    scenario.feedback.className = 'scenario-feedback';
    scenario.next.hidden = true;
    scenario.options.innerHTML = '';

    step.options.forEach(function (option) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = option.label;
      button.addEventListener('click', function () {
        scenario.options.querySelectorAll('button').forEach(function (other) {
          other.disabled = true;
          other.classList.toggle('is-selected', other === button);
        });
        scenario.feedback.textContent = option.feedback;
        scenario.feedback.className = 'scenario-feedback ' + (option.good ? 'is-good' : 'is-off');
        scenario.next.hidden = false;
        scenario.next.innerHTML = scenario.index === STEPS.length - 1
          ? 'Start over <span aria-hidden="true">↻</span>'
          : 'Next <span aria-hidden="true">→</span>';
      });
      scenario.options.appendChild(button);
    });
  }

  if (scenario.setup && scenario.question && scenario.options) {
    scenario.next.addEventListener('click', function () {
      scenario.index = (scenario.index + 1) % STEPS.length;
      renderScenario();
    });
    renderScenario();
  }
})();
