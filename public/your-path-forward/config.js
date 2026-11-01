/* Everything you need to edit lives here. */
window.JOIN_CONFIG = {
  /* Stripe payment link for the discounted first month. Every call to action
     on the page opens this directly. The promo code is prefilled by the link,
     so the price the page shows is the price at checkout. */
  checkoutUrl: 'https://buy.stripe.com/4gM14ngeN1T21kGasX2oE09?prefilled_promo_code=REDDITLEARNER',

  /* The offer runs on a rolling window rather than one fixed date, so the
     countdown never expires and never needs editing. cycleAnchor is the end of
     the first window; every cycleDays after it is another deadline, and the
     page always counts down to the next one. */
  /* Held to the end of 17 October (Swiss time) for this page's launch;
     after that it rolls on every cycleDays as before. */
  cycleAnchor: '2026-10-17T23:59:59+02:00',
  cycleDays: 3
};
