console.log("Jackpot+: content.js injected")

const THEME_KEY = "jp-theme"
const EXT_ENABLED_KEY = "jp-enabled"

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

let extensionEnabled = true

function applyExtensionEnabled(enabled) {
  extensionEnabled = enabled
}

async function loadEnabled() {
  try {
    const result = await chrome.storage.sync.get(EXT_ENABLED_KEY)
    const enabled = result[EXT_ENABLED_KEY]
    applyExtensionEnabled(enabled !== undefined ? enabled : true)
  } catch {
    applyExtensionEnabled(true)
  }
}

// Listen for theme changes from popup
chrome.runtime.onMessage.addListener(message => {
  if (message.type === "THEME_CHANGE") {
    if (extensionEnabled) document.documentElement.setAttribute("data-jp-theme", message.theme)
  }

  if (message.type === "THEME_REFRESH") {
    if (extensionEnabled) applyTheme()
  }

  if (message.type === "EXTENSION_TOGGLE") {
    applyExtensionEnabled(Boolean(message.enabled))
    if (!extensionEnabled) {
      document.documentElement.removeAttribute("data-jp-theme")
    } else {
      applyTheme()
    }
  }
})

function applystuff(reason) {
  console.log("Jackpot+: running transform —", reason)

  if (!extensionEnabled) return

  applyTheme()
  if (window.location.pathname === "/deck") {
    transformDeck()
  }
  if (window.location.pathname === "/shop") {
    transformShop()
  }
}

document.addEventListener("turbo:load", async () => {
  await loadEnabled()
  applystuff("turbo:load")
})

if (document.readyState !== "loading") {
  loadEnabled().then(() => applystuff("document.readyState !== 'loading'"))
}
