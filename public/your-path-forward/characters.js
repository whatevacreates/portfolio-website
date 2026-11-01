/* Scholé's product characters, using the same Rive file and SM-V3 view models
   as schole_landing_site/src/components/pharos-rive.tsx. */
(function () {
  'use strict';
  var section = document.getElementById('about');
  var assetBase = new URL(section.dataset.characterAssets || 'assets/rive/', document.baseURI);
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var characters = Array.from(section.querySelectorAll('[data-artboard]')).map(function (element) {
    return { element: element, engine: null, model: null, visible: false, machine: '', gaze: { x: 0, y: 0 }, target: { x: 0, y: 0 } };
  });
  var started = false, nearby = false, gazeFrame = null;
  function canAnimate(character) {
    return character.visible && !document.hidden && !motion.matches && !document.body.classList.contains('motion-paused');
  }
  function syncPlayback() {
    characters.forEach(function (character) {
      if (!character.engine || !character.machine) return;
      if (canAnimate(character)) character.engine.play(character.machine);
      else character.engine.pause(character.machine);
    });
  }
  function boolean(model, name, value) {
    var property = model && model.boolean(name);
    if (property) property.value = value;
  }
  function trigger(character, name) {
    if (!canAnimate(character) || !character.model) return;
    var property = character.model.trigger(name);
    if (property) property.trigger();
  }
  function resize(character) {
    if (character.engine) character.engine.resizeDrawingSurfaceToCanvas(Math.min(window.devicePixelRatio || 1, 2));
  }
  function loadRuntime() {
    var script = new Promise(function (resolve, reject) {
      if (window.rive) return resolve(window.rive);
      var tag = document.createElement('script');
      tag.src = new URL('rive.js', assetBase).href;
      tag.onload = function () { resolve(window.rive); };
      tag.onerror = reject;
      document.head.appendChild(tag);
    });
    var file = fetch(new URL('schole.riv', assetBase).href).then(function (response) {
      if (!response.ok) throw new Error('Character file unavailable');
      return response.arrayBuffer();
    });
    return Promise.all([script, file]);
  }
  function start() {
    if (started || motion.matches || !nearby) return;
    started = true;
    loadRuntime().then(function (assets) {
      var api = assets[0], buffer = assets[1];
      api.RuntimeLoader.setWasmUrl(new URL('rive.wasm', assetBase).href);
      api.RuntimeLoader.setWasmFallbackUrl(null);
      characters.forEach(function (character) {
        var canvas = character.element.querySelector('canvas');
        character.engine = new api.Rive({
          buffer: buffer,
          canvas: canvas,
          artboard: character.element.dataset.artboard,
          stateMachines: 'SM-V3',
          autoBind: true,
          autoplay: true,
          layout: new api.Layout({ fit: api.Fit.Contain, alignment: api.Alignment.Center }),
          onLoad: function () {
            var engine = character.engine;
            var names = engine.stateMachineNames;
            character.machine = names.includes('SM-V3') ? 'SM-V3' : names[0];
            character.model = engine.viewModelInstance;
            if (!character.model) {
              var model = engine.viewModelByName(character.element.dataset.artboard + 'VM');
              if (model) { character.model = model.instance(); engine.bindViewModelInstance(character.model); }
            }
            boolean(character.model, 'show', true);
            boolean(character.model, 'removeNode', true);
            boolean(character.model, 'loading', false);
            boolean(character.model, 'followMouse', false);
            resize(character);
            character.element.classList.add('is-live');
            character.element.dataset.animation = 'ready';
            syncPlayback();
          },
          onLoadError: function () {
            character.element.classList.remove('is-live');
            character.element.dataset.animation = 'fallback';
          }
        });
        if ('ResizeObserver' in window) new ResizeObserver(function () { resize(character); }).observe(character.element);
      });
    }).catch(function () {
      // Keep the original character artwork if the browser cannot run Rive.
      characters.forEach(function (character) { character.element.dataset.animation = 'fallback'; });
    });
  }
  if ('IntersectionObserver' in window) {
    var lazy = new IntersectionObserver(function (entries) {
      nearby = entries[0].isIntersecting;
      if (nearby) start();
    }, { rootMargin: '350px' });
    lazy.observe(section);
    var visibility = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var character = characters.find(function (item) { return item.element === entry.target; });
        character.visible = entry.isIntersecting;
      });
      syncPlayback();
    });
    characters.forEach(function (character) { visibility.observe(character.element); });
  } else {
    nearby = true;
    characters.forEach(function (character) { character.visible = true; });
    start();
  }
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('schole-motion-change', syncPlayback);
  motion.addEventListener('change', function () { start(); syncPlayback(); });
  window.addEventListener('pageshow', syncPlayback);

  // Ease all four characters' eyes toward the pointer using their product inputs.
  function tickGaze() {
    var moving = false;
    characters.forEach(function (character) {
      if (!canAnimate(character) || !character.model) return;
      var dx = character.target.x - character.gaze.x, dy = character.target.y - character.gaze.y;
      character.gaze.x += dx * 0.14; character.gaze.y += dy * 0.14;
      if (Math.abs(dx) + Math.abs(dy) > 0.3) moving = true;
      var x = character.model.number('cursorX'), y = character.model.number('cursorY');
      if (x) x.value = character.gaze.x;
      if (y) y.value = character.gaze.y;
    });
    gazeFrame = moving ? requestAnimationFrame(tickGaze) : null;
  }
  section.addEventListener('pointermove', function (event) {
    if (event.pointerType === 'touch') return;
    characters.forEach(function (character) {
      if (!canAnimate(character) || !character.model) return;
      var box = character.element.getBoundingClientRect();
      character.target.x = Math.max(-100, Math.min(100, (event.clientX - box.left - box.width / 2) / 5));
      character.target.y = Math.max(-100, Math.min(100, -(event.clientY - box.top - box.height / 2) / 3));
      boolean(character.model, 'followMouse', true);
    });
    if (gazeFrame === null) gazeFrame = requestAnimationFrame(tickGaze);
  });
  section.addEventListener('pointerleave', function () {
    characters.forEach(function (character) { boolean(character.model, 'followMouse', false); });
  });
  characters.forEach(function (character) {
    var button = character.element.closest('button');
    button.addEventListener('pointerenter', function () { trigger(character, 'HoverON'); });
    button.addEventListener('pointerleave', function () { trigger(character, 'HoverOFF'); });
    button.addEventListener('click', function () { trigger(character, 'hoverTrig'); });
  });
})();
