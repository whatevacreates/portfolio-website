/* Scholé's existing Reddit Ads pixel. Production only; no URL parameters or form values sent. */
(function () {
  'use strict';
  var PIXEL_ID = 'a2_jp4iws862af4';
  var CLICK_ID_KEY = 'schole:rdt_cid';
  var CLICK_ID_TTL = 28 * 24 * 60 * 60 * 1000;
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var PRODUCT = { id: 'your-path-forward', name: 'Scholé first month, 80% off', category: 'Subscription' };
  if (location.hostname !== 'try.schole.ai' || window.__scholeRedditPixelInstalled) return;
  window.__scholeRedditPixelInstalled = true;

  /* Queue events while Reddit's async SDK loads, as on the main landing site. */
  if (!window.rdt) {
    var pixel = window.rdt = function () {
      if (pixel.sendEvent) pixel.sendEvent.apply(pixel, arguments);
      else pixel.callQueue.push(Array.prototype.slice.call(arguments));
    };
    pixel.callQueue = [];
  }

  var sent = Object.create(null);
  function trackOnce(event, name, metadata) {
    var key = name || event;
    if (sent[key]) return;
    sent[key] = true;
    var conversionId = window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : 'your-path-forward-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    try {
      window.rdt('track', event, Object.assign({ conversionId: conversionId }, metadata || {}, name ? { customEventName: name } : {}));
    } catch (_) { /* Tracking must never interfere with the page or checkout. */ }
  }
  window.rdt('init', PIXEL_ID);
  trackOnce('PageVisit');
  trackOnce('ViewContent', '', { products: [PRODUCT] });

  if (!document.querySelector('script[src="https://www.redditstatic.com/ads/pixel.js"]')) {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.redditstatic.com/ads/pixel.js';
    document.head.appendChild(script);
  }

  var campaign = new URLSearchParams(location.search);

  /* First-party attribution passport read by the Scholé backend at signup (app.schole.ai
     is another origin, so a .schole.ai cookie is the only channel). Written only for a
     valid rdt_cid. Opt-out: the visitor's own Global Privacy Control means "denied",
     otherwise "unset"; never "granted". Standalone copy of the same block in the other
     landing scripts and the main site; the backend parser expects this exact shape. */
  (function writePassport() {
    try {
      var cid = campaign.get('rdt_cid');
      if (!cid || !/^[A-Za-z0-9._~-]{1,512}$/.test(cid)) return;
      var utm = {};
      UTM_KEYS.forEach(function (key) {
        var raw = campaign.get(key);
        if (raw === null) return;
        var value = raw.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').slice(0, 255);
        if (/[\ud800-\udbff]$/.test(value)) value = value.slice(0, -1);
        if (value) utm[key] = value;
      });
      var denied = typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true;
      var encode = function (u) {
        return btoa(unescape(encodeURIComponent(JSON.stringify({
          c: cid, u: u, t: Date.now(), p: location.pathname, k: denied ? 'denied' : 'unset'
        })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      };
      var value = encode(utm);
      if (value.length > 3500) value = encode({});
      if (value.length > 3500) return;
      document.cookie = 'schole_ad=' + value +
        '; Domain=.schole.ai; Path=/; Max-Age=2419200; Secure; SameSite=Lax';
    } catch (_) { /* Attribution must never interfere with the page. */ }
  })();

  /* Carry the ad click across the hop to Stripe: the payment link's client_reference_id comes
     back verbatim on checkout.session.completed. Format: "rdt_" + base64url(no padding) of
     rdt_cid + "|" + _rdt_uuid, mirrored by parse_client_reference in the backend. The
     identifiers are only accepted in the character set that keeps the "|" split unambiguous. */
  var ID_PATTERN = /^[A-Za-z0-9._~-]{1,512}$/;
  function readClickId() {
    var incoming = campaign.get('rdt_cid');
    if (incoming && ID_PATTERN.test(incoming)) return incoming;
    try {
      var stored = JSON.parse(localStorage.getItem(CLICK_ID_KEY) || 'null');
      if (stored && typeof stored.id === 'string' && ID_PATTERN.test(stored.id) &&
          Number.isFinite(stored.at) && stored.at <= Date.now() && Date.now() - stored.at < CLICK_ID_TTL) {
        return stored.id;
      }
    } catch (_) { /* Storage can be unavailable in private browsing. */ }
    return '';
  }
  function readPixelUuid() {
    try {
      var match = document.cookie.match(/(?:^|;\s*)_rdt_uuid=([^;]+)/);
      var value = match ? decodeURIComponent(match[1]) : '';
      return ID_PATTERN.test(value) ? value : '';
    } catch (_) { return ''; }
  }
  function clientReference() {
    var clickId = readClickId();
    var uuid = readPixelUuid();
    if (!clickId && !uuid) return '';
    try {
      var reference = 'rdt_' + btoa(clickId + '|' + uuid).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return reference.length <= 200 ? reference : '';
    } catch (_) { return ''; }
  }
  /* Done at click time, never cancelling the click: page.js rewrites [data-checkout] hrefs at
     load, and a decorated href must not be overwritten. The browser then follows the link. */
  function tagCheckout(link) {
    try {
      var reference = clientReference();
      if (!reference) return;
      var url = new URL(link.href);
      url.searchParams.set('client_reference_id', reference);
      link.href = url.toString();
    } catch (_) { /* A tagging failure must never break the checkout link. */ }
  }

  /* Every call to action opens the Stripe payment link. The purchase itself is
     tracked by the schole.ai pixel on /welcome, where Stripe redirects. */
  function isCheckout(link) {
    try { return new URL(link.href).hostname === 'buy.stripe.com'; } catch (_) { return false; }
  }
  function watchClick(event) {
    if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    var target = event.target;
    if (!target || !target.closest) return;
    if (target.closest('#vsl-sound')) trackOnce('Custom', 'JoinVSLPlay');
    var link = target.closest('a[href]');
    if (link && isCheckout(link)) {
      tagCheckout(link);
      trackOnce('AddToCart', '', { itemCount: 1, products: [PRODUCT] });
    }
  }
  document.addEventListener('click', watchClick, { capture: true });
  document.addEventListener('auxclick', watchClick, { capture: true });
})();
