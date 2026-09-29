// Everything you'll need to change lives here. The page reads it on load.
window.OWN_A_CAR = {
  // Kickstarter project URL (recommended: it handles all-or-nothing on its own), or a Stripe Payment Link
  // (collects name, email and shipping address). See PLAYBOOK.md § 3.
  // Leave empty until legal is settled: the button then reads "Presale opens soon" and takes no money.
  checkoutUrl: "",

  // Discord invite. Shown after checkout (set the Payment Link's confirmation page to ../own-a-car/thanks.html).
  discordUrl: "",

  priceUsd: 50,
  goalKeys: 4000,              // see PLAYBOOK.md § "The math"
  deadline: "2026-12-31T23:59:59-05:00",
  shipWindow: "Spring 2027",   // the promised ship date (the FTC Mail Order Rule holds you to it)
};
