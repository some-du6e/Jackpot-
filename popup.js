// Jackpot+ — Popup Theme Switcher
console.log("Jackpot+: popup loaded.")

const THEME_KEY = "jp-theme"
const EXT_ENABLED_KEY = "jp-enabled"

// Load saved theme on popup open
document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.sync.get([THEME_KEY, "hackatime_api_key"])
  const savedTheme = result[THEME_KEY] || "plain"
  applyThemeSelection(savedTheme)

  // Load API key
  const apiKey = result.hackatime_api_key || ""
  const input = document.getElementById("hackatime-api-key")
  if (input && apiKey) {
    input.value = apiKey
  }

  // Load extension toggle
  const enabled = result[EXT_ENABLED_KEY]
  const isEnabled = enabled !== undefined ? enabled : true
  setExtensionEnabled(isEnabled)
})

function setExtensionEnabled(isEnabled) {
  const btn = document.getElementById("toggle-extension")
  const label = document.getElementById("toggle-extension-label")

  if (btn) btn.setAttribute("aria-pressed", isEnabled ? "true" : "false")
  if (label) label.textContent = isEnabled ? "On" : "Off"
  if (btn) btn.classList.toggle("off", !isEnabled)

  chrome.tabs
    .query({ url: "https://jackpot.hackclub.com/*" })
    .then(tabs => {
      tabs.forEach(tab => {
        chrome.tabs
          .sendMessage(tab.id, { type: "EXTENSION_TOGGLE", enabled: isEnabled })
          .catch(() => {})
      })
    })
    .catch(() => {})

  // Keep UI + theme changes snappy across existing tabs
  setTimeout(() => {
    chrome.tabs
      .query({ url: "https://jackpot.hackclub.com/*" })
      .then(tabs => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { type: "THEME_REFRESH" }).catch(() => {})
        })
      })
      .catch(() => {})
  }, 0)
}

// Save API key
document.getElementById("save-api-key")?.addEventListener("click", async () => {
  const input = document.getElementById("hackatime-api-key")
  const status = document.getElementById("api-key-status")
  const key = input.value.trim()

  await chrome.storage.sync.set({ hackatime_api_key: key })

  if (status) {
    status.textContent = key ? "Saved!" : "Cleared"
    setTimeout(() => {
      status.textContent = ""
    }, 2000)
  }
})

// Extension toggle
document.getElementById("toggle-extension")?.addEventListener("click", async () => {
  const current = document.getElementById("toggle-extension")?.getAttribute("aria-pressed")
  const isEnabled = current === "true"
  const nextEnabled = !isEnabled
  await chrome.storage.sync.set({ [EXT_ENABLED_KEY]: nextEnabled })
  setExtensionEnabled(nextEnabled)
})

// Handle theme option clicks
document.querySelectorAll(".theme-option").forEach(option => {
  option.addEventListener("click", () => {
    const theme = option.dataset.theme
    selectTheme(theme)
  })

  // Keyboard support
  option.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const theme = option.dataset.theme
      selectTheme(theme)
    }
  })
})

// API key visibility toggle
const apiKeyInput = document.getElementById("hackatime-api-key")
const apiKeyToggleBtn = document.getElementById("toggle-api-key-visibility")
apiKeyToggleBtn?.addEventListener("click", () => {
  if (!apiKeyInput) return
  const isPassword = apiKeyInput.type === "password"
  apiKeyInput.type = isPassword ? "text" : "password"
})

async function selectTheme(theme) {
  // Save to chrome storage
  await chrome.storage.sync.set({ [THEME_KEY]: theme })

  // Update UI
  applyThemeSelection(theme)

  // Notify content scripts to update
  const tabs = await chrome.tabs.query({ url: "https://jackpot.hackclub.com/*" })
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, { type: "THEME_CHANGE", theme }).catch(() => {
      // Tab might not have content script loaded, ignore
    })
  })

  console.log("Jackpot+: theme set to", theme)
}

function applyThemeSelection(theme) {
  document.querySelectorAll(".theme-option").forEach(opt => {
    const isSelected = opt.dataset.theme === theme
    opt.classList.toggle("selected", isSelected)
    opt.setAttribute("aria-checked", isSelected ? "true" : "false")
  })

  // Apply theme to popup itself
  document.documentElement.setAttribute("data-jp-theme", theme)
}
