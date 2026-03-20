console.log("Jackpot+: content.js injected")

const THEME_KEY = "jp-theme"

// Apply theme from storage
async function applyTheme() {
  try {
    const result = await chrome.storage.sync.get(THEME_KEY)
    const theme = result[THEME_KEY] || "plain"
    document.documentElement.setAttribute("data-jp-theme", theme)
  } catch (e) {
    // Storage might not be available
    console.log("Jackpot+: could not load theme", e)
  }
}

// Listen for theme changes from popup
chrome.runtime.onMessage.addListener(message => {
  if (message.type === "THEME_CHANGE") {
    document.documentElement.setAttribute("data-jp-theme", message.theme)
  }
})

function applystuff(reason) {
  console.log("Jackpot+: running transform —", reason)
  applyTheme()
  if (window.location.pathname === "/deck") {
    transformDeck()
  }
  if (window.location.pathname === "/shop") {
    transformShop()
  }
}

document.addEventListener("turbo:load", () => applystuff("turbo:load"))

if (document.readyState !== "loading") applystuff("document.readyState !== 'loading'")
