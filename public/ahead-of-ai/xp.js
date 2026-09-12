/* ExperienceBarConcise from the product supplies the visual language: a flat
   warm orb, two gold waves and rising Scholé sparks. Here the same bar value is
   scroll-scrubbed so down fills it and up drains it. */
(function () {
  var section = document.querySelector('.science');
  var stage = document.querySelector('.xp-stage');
  var liquid = document.querySelector('.xp-liquid');
  var number = document.querySelector('.xp-orb-number');
  if (!section || !stage || !liquid || !number) return;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 0;
  var target = 0;
  var ticking = false;
  var MAX_XP = 180;

  function clamp(value) { return Math.max(0, Math.min(1, value)); }

  function readProgress() {
    var rect = section.getBoundingClientRect();
    /* Filling begins as the section enters the lower viewport and completes
       just before it leaves at the top. The same geometry reverses on scroll up. */
    return clamp((innerHeight * .74 - rect.top) / (innerHeight * .94));
  }

  function paint(progress) {
    var emptyOffset = (1 - progress) * 112;
    liquid.style.transform = 'translate3d(0,' + emptyOffset.toFixed(3) + '%,0)';
    number.textContent = Math.round(progress * MAX_XP);
    stage.style.setProperty('--xp-progress', progress.toFixed(4));
  }

  function frame() {
    target = readProgress();
    if (reduced) current = target;
    else current += (target - current) * .2;
    if (Math.abs(target - current) < .0007) current = target;
    paint(current);

    if (current !== target) requestAnimationFrame(frame);
    else ticking = false;
  }

  function requestPaint() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }

  addEventListener('scroll', requestPaint, { passive:true });
  addEventListener('resize', requestPaint, { passive:true });
  current = target = readProgress();
  paint(current);
})();
