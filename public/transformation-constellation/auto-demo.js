/* Portfolio copy: self-playing demo. The embed demonstrates itself — picks
   the team-lead flow, types a role and builds the plan — so nobody has to
   interact with the page for real. Any genuine visitor input (trusted
   pointer/key events) cancels the show and hands them the controls. */
(function () {
  var cancelled = false;
  var stop = function (e) { if (e.isTrusted) cancelled = true; };
  ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (t) {
    addEventListener(t, stop, { capture: true, passive: true });
  });

  var ROLE = 'Operations Manager';

  var findButton = function (text) {
    var els = document.querySelectorAll('button, [role="button"]');
    for (var i = 0; i < els.length; i++) {
      if ((els[i].textContent || '').replace(/\s+/g, ' ').indexOf(text) !== -1) return els[i];
    }
    return null;
  };

  // poll for an element until it exists (the app mounts asynchronously)
  var waitFor = function (get, then, tries) {
    if (cancelled) return;
    var el = get();
    if (el) return then(el);
    if (tries > 0) setTimeout(function () { waitFor(get, then, tries - 1); }, 250);
  };

  var click = function (el) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  };

  // React-compatible typing: set the value through the native setter so the
  // synthetic input event carries it past React's value tracking
  var nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  var typeInto = function (input, text, done) {
    var i = 0;
    var tick = function () {
      if (cancelled || !document.contains(input)) return;
      nativeSet.call(input, text.slice(0, i + 1));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      i += 1;
      if (i < text.length) setTimeout(tick, 60 + Math.random() * 90);
      else setTimeout(done, 500);
    };
    input.focus();
    tick();
  };

  var run = function () {
    // 1 · the choice screen: take the team-lead path
    waitFor(function () { return findButton('rolling AI out'); }, function (choice) {
      click(choice);
      // 2 · the role field fills itself up
      waitFor(function () { return document.querySelector('input[placeholder]'); }, function (input) {
        typeInto(input, ROLE, function () {
          // 3 · build the plan: the constellation draws on its own
          waitFor(function () { return findButton('Build their plan'); }, function (go) {
            if (!cancelled) click(go);
          }, 20);
        });
      }, 40);
    }, 40);
  };

  // let the landing screen breathe before the show starts
  if (document.readyState === 'complete') setTimeout(run, 1400);
  else addEventListener('load', function () { setTimeout(run, 1400); });
})();
