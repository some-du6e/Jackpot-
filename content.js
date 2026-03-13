// Jackpot+ — Content script entry point
// Modules loaded before this: cleanup.js, styles.js, shop.js, toolbar.js, deck.js
console.log("Jackpot+: content script loaded.")

// Track current page type to detect navigation changes
let __jackpotCurrentPage = null

function getCurrentPageType() {
  if (document.body.classList.contains("shop-body")) return "shop"
  if (document.body.classList.contains("deck-body")) return "deck"
  return null
}

// Start immediately
startInlineOverrideSanitizer()
injectStyles()
injectShopIcons()

function initPage() {
  // Remove any previous JP transformations so they can be re-applied
  document.querySelectorAll(".jp-shop-container").forEach(el => el.remove())
  document.querySelectorAll(".jackpot-simple-list").forEach(el => el.remove())
  document.querySelectorAll(".jp-toolbar-stats").forEach(el => el.remove())

  // Restore hidden originals (they get hidden via CSS, but let's be safe)
  // Skip Add Prize / Shop Rules buttons — they're moved into the shop header
  document.querySelectorAll(".deck-table, .shop-right > *:not(.jp-shop-container)").forEach(el => {
    if (el.tagName === "BUTTON") {
      const text = el.textContent.trim()
      if (text === "Add Prize" || text === "Shop Rules") return
    }
    el.style.display = ""
  })

  // Restore original token count
  const tokenCount = document.querySelector(".token-count")
  if (tokenCount) tokenCount.style.display = ""

  if (document.body.classList.contains("shop-body")) {
    transformShop()
  } else if (document.body.classList.contains("deck-body")) {
    // The site's initDeck() has a deckInitialized flag that prevents re-running.
    // Content scripts can't access page JS directly, so inject a script tag.
    const resetScript = document.createElement("script")
    resetScript.textContent = `
      if (typeof deckInitialized !== "undefined") {
        deckInitialized = false;
      }
      if (typeof initDeck === "function") {
        console.log("Jackpot+: injected script calling initDeck()");
        initDeck();
      }
    `
    document.head.appendChild(resetScript)
    resetScript.remove()
    // Now transform after a delay to let initDeck() populate the DOM
    setTimeout(() => transformDeck(), 300)
  }
  injectShopIcons()
  enhanceToolbar()
}

// Run on initial load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage)
} else {
  initPage()
}

// Re-run on SPA/Turbo navigation (tab changes)
document.addEventListener("turbo:load", () => {
  console.log("Jackpot+: turbo:load detected, re-initializing")
  setTimeout(initPage, 100)
})

document.addEventListener("turbo:render", () => {
  console.log("Jackpot+: turbo:render detected, re-initializing")
  setTimeout(initPage, 100)
})

// Also catch popstate (back/forward) and general navigation
window.addEventListener("popstate", () => {
  console.log("Jackpot+: popstate detected, re-initializing")
  setTimeout(initPage, 100)
})

// Watch for body class changes (page type switches)
const bodyClassObserver = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.attributeName === "class") {
      const body = document.body
      const hasShopTransform = document.querySelector(".jp-shop-container")
      const hasDeckTransform = document.querySelector(".jackpot-simple-list")

      // If body class changed and our transform is missing or wrong, re-init
      if (body.classList.contains("shop-body") && !hasShopTransform) {
        console.log("Jackpot+: shop-body detected without transform, re-initializing")
        setTimeout(initPage, 100)
        break
      }
      if (body.classList.contains("deck-body") && !hasDeckTransform) {
        console.log("Jackpot+: deck-body detected without transform, re-initializing")
        setTimeout(initPage, 100)
        break
      }
    }
  }
})

bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] })

// Watch for deck-table appearing in DOM (faster than polling)
const deckTableObserver = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) {
        // Element node
        if (node.classList?.contains("deck-table") || node.querySelector?.(".deck-table")) {
          console.log("Jackpot+: deck-table appeared in DOM, transforming")
          setTimeout(() => transformDeck(), 100)
          return
        }
        if (node.classList?.contains("shop-right") || node.querySelector?.(".shop-right")) {
          console.log("Jackpot+: shop-right appeared in DOM, transforming")
          setTimeout(() => transformShop(), 100)
          return
        }
      }
    }
  }
})

deckTableObserver.observe(document.body, { childList: true, subtree: true })
