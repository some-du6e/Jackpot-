// Jackpot+ — Inline styles injection
console.log("Jackpot+: styles module loaded.")

function injectStyles() {
  // Load external CSS file instead of inline styles
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = chrome.runtime.getURL("injected-styles.css")
  document.head.appendChild(link)

  console.log("Jackpot+: styles injected")
}
