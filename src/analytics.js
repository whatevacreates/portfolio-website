// visitor analytics (PostHog, EU): anonymous pageviews and named clicks only —
// no session recording, no identified profiles. Local dev stays out of the
// numbers. Lazily imported into its own chunk so the hero never waits for it.
// The app routes via location.hash, so each hash change is a pageview.
const enabled = !/^(localhost|127\.)/.test(location.hostname);

// clicks that land before the chunk has loaded wait here, then flush
let posthog;
const queue = [];

if (enabled) {
  import('posthog-js').then(({ default: ph }) => {
    ph.init('phc_dNFSfw3l9oqvM5S2vWX0hnEJTG5jID4hEH3pmY4n7A4', {
      api_host: 'https://eu.i.posthog.com',
      defaults: '2025-05-24',
      capture_pageview: true, // captures the initial load; hash routing below
      person_profiles: 'identified_only',
      disable_session_recording: true,
    });
    addEventListener('hashchange', () => ph.capture('$pageview'));
    posthog = ph;
    queue.splice(0).forEach(([event, props]) => ph.capture(event, props));
  });
}

// named click events, so the PostHog event list reads as a plain sentence
// ("video_played", "contact_clicked") instead of raw autocaptured elements
export function track(event, props) {
  if (!enabled) return;
  if (posthog) posthog.capture(event, props);
  else queue.push([event, props]);
}
