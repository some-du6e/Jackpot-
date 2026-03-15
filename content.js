// Jackpot+ — Content script entry point
// Modules loaded before this: cleanup.js, styles.js, shop.js, toolbar.js, deck.js, settings.js
console.log("Jackpot+: content script loaded.")

// Define JackpotSettings with default themes
if (!window.JackpotSettings) {
  window.JackpotSettings = {
    THEMES: {
      plain: { name: "Plain", description: "Clean, modern look" },
      hacker: { name: "Hacker", description: "Terminal green-on-black" },
    },

    currentTheme: "plain",

    // Hackatime API key (optional)
    hackatimeKey: null,

    getHackatimeKey() {
      return this.hackatimeKey
    },

    setHackatimeKey(key) {
      this.hackatimeKey = key || null
      try {
        chrome.storage.sync.set({ hackatime_api_key: key }, () => {
          console.log("Jackpot+: Hackatime API key saved")
        })
      } catch (e) {
        console.warn("Jackpot+: Failed to persist hackatime key", e)
      }
    },

    getCurrentTheme() {
      return this.currentTheme
    },

    applyTheme(themeName) {
      if (!this.THEMES[themeName]) return
      try {
        document.documentElement.setAttribute("data-jp-theme", themeName)
        this.currentTheme = themeName
        console.log(`Jackpot+: Applied theme ${themeName}`)
      } catch (e) {
        console.warn("Jackpot+: Failed to apply theme", e)
      }
    },

    async setTheme(themeName) {
      if (!this.THEMES[themeName]) {
        console.warn(`Jackpot+: Theme '${themeName}' not found`)
        return false
      }
      this.applyTheme(themeName)
      return new Promise(resolve => {
        try {
          chrome.storage.sync.set({ jackpot_plus_theme: themeName }, () => {
            console.log(`Jackpot+: Theme persisted as ${themeName}`)
            resolve(true)
          })
        } catch (e) {
          console.warn("Jackpot+: Failed to persist theme", e)
          resolve(false)
        }
      })
    },

    initSettings() {
      // Load persisted theme and Hackatime API key (if any)
      try {
        chrome.storage.sync.get(["jackpot_plus_theme", "hackatime_api_key"], result => {
          const theme = result.jackpot_plus_theme || this.currentTheme || "plain"
          if (this.THEMES[theme]) {
            this.applyTheme(theme)
          }
          if (result.hackatime_api_key) {
            this.hackatimeKey = result.hackatime_api_key
            console.log("Jackpot+: Loaded Hackatime API key from storage")
          }
        })
      } catch (e) {
        console.log("Jackpot+: Settings initialized (no storage available)")
      }
    },
  }
}

// Track current page type to detect navigation changes
let __jackpotCurrentPage = null

// Add Settings link to profile dropdown
function addSettingsToDropdown() {
  const dropdown = document.getElementById("profileDropdown")
  if (!dropdown) return

  // Check if settings link already exists
  if (dropdown.querySelector(".jp-settings-link")) return

  // Create settings link
  const settingsLink = document.createElement("a")
  settingsLink.href = "#"
  settingsLink.className = "dropdown-item jp-settings-link"
  settingsLink.textContent = "⚙️ Settings"
  settingsLink.addEventListener("click", e => {
    e.preventDefault()
    e.stopPropagation()
    openSettingsModal()
    dropdown.style.display = "none"
  })

  // Insert before Sign Out link
  const signOutLink = dropdown.querySelector('a[href="/signout"]')
  if (signOutLink) {
    dropdown.insertBefore(settingsLink, signOutLink)
  } else {
    dropdown.appendChild(settingsLink)
  }
}

// Settings modal
function openSettingsModal() {
  // Check if modal already exists
  let modal = document.getElementById("jpSettingsModal")
  if (!modal) {
    modal = createSettingsModal()
  }
  modal.classList.add("active")
  modal.setAttribute("aria-hidden", "false")
}

function closeSettingsModal() {
  const modal = document.getElementById("jpSettingsModal")
  if (modal) {
    modal.classList.remove("active")
    modal.setAttribute("aria-hidden", "true")
  }
}

function createSettingsModal() {
  const modal = document.createElement("div")
  modal.id = "jpSettingsModal"
  modal.className = "modal-overlay jp-settings-modal"
  modal.setAttribute("aria-hidden", "true")

  const currentTheme = window.JackpotSettings?.getCurrentTheme() || "plain"
  const themes = window.JackpotSettings?.THEMES || {}

  let themeOptions = ""
  for (const [key, theme] of Object.entries(themes)) {
    const selected = key === currentTheme ? "selected" : ""
    themeOptions += `<option value="${key}" ${selected}>${theme.name} — ${theme.description}</option>`
  }

  modal.innerHTML = `
    <div class="modal-content jp-settings-content" role="dialog" aria-modal="true" aria-labelledby="jpSettingsTitle">
      <div class="modal-header">
        <h3 class="modal-title" id="jpSettingsTitle">Jackpot+ Settings</h3>
        <button type="button" class="modal-close" id="jpSettingsClose" aria-label="Close">×</button>
      </div>
      <div class="jp-settings-body">
        <div class="jp-settings-field">
          <label for="jpThemeSelect">Theme</label>
          <select id="jpThemeSelect" class="jp-theme-select">
            ${themeOptions}
          </select>
          <p class="jp-settings-hint">Choose your preferred visual style</p>
        </div>
        <div class="jp-settings-field">
          <label for="jpHackatimeKey">Hackatime API Key (optional)</label>
          <input type="text" id="jpHackatimeKey" class="jp-settings-input" placeholder="waka_xxx or API key" />
          <p class="jp-settings-hint">Optional. Used to show today's coding time in the toolbar.</p>
        </div>
        <div class="jp-settings-preview" id="jpThemePreview">
          <div class="jp-preview-header">Preview</div>
          <div class="jp-preview-content">
            <div class="jp-preview-stat jp-preview-chips">
              <span class="jp-preview-label">Chips</span>
              <span class="jp-preview-value">42.0</span>
            </div>
            <div class="jp-preview-stat jp-preview-hours">
              <span class="jp-preview-label">Hours</span>
              <span class="jp-preview-value">12.5h</span>
            </div>
          </div>
        </div>
      </div>
      <div class="project-form-actions">
        <button type="button" class="project-cancel-btn" id="jpSettingsCancel">Cancel</button>
        <button type="button" class="project-save-btn" id="jpSettingsSave">Save Theme</button>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Event listeners
  const closeBtn = modal.querySelector("#jpSettingsClose")
  const cancelBtn = modal.querySelector("#jpSettingsCancel")
  const saveBtn = modal.querySelector("#jpSettingsSave")
  const themeSelect = modal.querySelector("#jpThemeSelect")
  const hackKeyInput = modal.querySelector("#jpHackatimeKey")

  closeBtn.addEventListener("click", closeSettingsModal)
  cancelBtn.addEventListener("click", closeSettingsModal)

  // Close on overlay click
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSettingsModal()
  })

  // Close on Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeSettingsModal()
  })

  // Preview theme on change
  themeSelect.addEventListener("change", () => {
    const selectedTheme = themeSelect.value
    if (window.JackpotSettings) {
      // Temporarily apply theme for preview
      window.JackpotSettings.setTheme(selectedTheme)
    }
  })

  // Save theme
  saveBtn.addEventListener("click", async () => {
    const selectedTheme = themeSelect.value
    if (window.JackpotSettings) {
      await window.JackpotSettings.setTheme(selectedTheme)
    }
    // Persist hackatime key (optional)
    if (hackKeyInput) {
      const key = hackKeyInput.value.trim()
      window.JackpotSettings.setHackatimeKey(key || null)
    }

    // Refresh toolbar to pick up new key immediately
    document.querySelectorAll(".jp-toolbar-stats").forEach(el => el.remove())
    enhanceToolbar()
    closeSettingsModal()
  })

  // Populate hackatime input with saved value (async)
  try {
    chrome.storage.sync.get(["hackatime_api_key"], result => {
      if (hackKeyInput) hackKeyInput.value = result.hackatime_api_key || ""
    })
  } catch (e) {
    console.warn("Jackpot+: failed to load hackatime key for settings modal", e)
  }

  return modal
}

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
  // Initialize settings on first load
  if (window.JackpotSettings && !window.__jackpotSettingsInitialized) {
    window.JackpotSettings.initSettings()
    window.__jackpotSettingsInitialized = true
  }

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

  // Restore Add Project buttons
  document.querySelectorAll('.deck-add-btn, .add-project-btn, button[data-action="add-project"]').forEach(btn => {
    btn.style.display = ""
  })

  // Restore original token count
  const tokenCount = document.querySelector(".token-count")
  if (tokenCount) tokenCount.style.display = ""

  if (document.body.classList.contains("shop-body")) {
    transformShop()
  } else if (document.body.classList.contains("deck-body")) {
    // Use chrome.scripting API via service worker to execute in MAIN world
    // This resets the deckInitialized flag so initDeck() can run again
    chrome.runtime.sendMessage({ action: "resetDeck" }, response => {
      if (chrome.runtime.lastError) {
        console.warn("Jackpot+: resetDeck message failed:", chrome.runtime.lastError.message)
      } else {
        console.log("Jackpot+: resetDeck response:", response)
      }
      // Wait for initDeck() to run and render the deck table, then transform
      setTimeout(() => transformDeck(), 800)
    })
  }
  injectShopIcons()
  enhanceToolbar()
  addSettingsToDropdown()
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
