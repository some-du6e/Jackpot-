// Jackpot+ — Page world script (runs in MAIN world to access page JS)
// This script is injected into the page's context to reset deckInitialized flag

console.log("Jackpot+: page-script.js executing in MAIN world");

if (typeof deckInitialized !== "undefined") {
  deckInitialized = false;
  console.log("Jackpot+: deckInitialized reset to false");
} else {
  console.log("Jackpot+: deckInitialized not found in MAIN world");
}

function callInitDeckWhenReady() {
  if (typeof initDeck === "function") {
    // Wait for deck-page to have content before calling initDeck
    const deckPage = document.querySelector('.deck-page');
    if (deckPage && deckPage.children.length > 0) {
      console.log("Jackpot+: deck-page has content, calling initDeck()");
      initDeck();
    } else {
      console.log("Jackpot+: deck-page empty, waiting for content...");
      const observer = new MutationObserver((mutations, obs) => {
        const dp = document.querySelector('.deck-page');
        if (dp && dp.children.length > 0) {
          obs.disconnect();
          console.log("Jackpot+: deck-page now has content, calling initDeck()");
          initDeck();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      // Safety timeout
      setTimeout(() => {
        observer.disconnect();
        console.log("Jackpot+: timed out waiting for deck-page content");
      }, 10000);
    }
  } else {
    console.log("Jackpot+: initDeck function not found in MAIN world");
  }
}

callInitDeckWhenReady();
