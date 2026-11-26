// visitor analytics: Google Tag Manager container (whatevacreates).
// Local dev stays out of the numbers. Snippet as given by Google, loaded from
// here instead of index.html so localhost is skipped.
// The app routes via location.hash, so each hash change is pushed as a
// 'page_view' dataLayer event; clicks are pushed under their own names.
const GTM_ID = 'GTM-KFXW567W';
const on = !/^(localhost|127\.)/.test(location.hostname);

window.dataLayer = window.dataLayer || [];

if (on) {
  window.gtag = function gtag() { dataLayer.push(arguments); };
  gtag('js', new Date());
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
  addEventListener('hashchange', () => dataLayer.push({
    event: 'page_view',
    page_location: location.href,
    page_path: location.pathname + location.hash,
    page_title: document.title,
  }));
}

// named click events ("video_played", "contact_clicked")
export function track(event, props) {
  if (on) dataLayer.push({ event, ...props });
}
