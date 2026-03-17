// Jackpot+ — Page world script (runs in MAIN world to access page JS)
// This script is injected into the page's context to reset deckInitialized flag

console.log("Jackpot+: page-script.js executing in MAIN world")

// Reset deckInitialized so the site's own turbo:load handler will call initDeck()
// We do NOT call initDeck() ourselves — we let the site handle it
if (typeof deckInitialized !== "undefined") {
  deckInitialized = false
  console.log("Jackpot+: deckInitialized reset to false (site will call initDeck)")
} else {
  console.log("Jackpot+: deckInitialized not found in MAIN world")
}
