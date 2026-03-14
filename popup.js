// Jackpot+ — Popup script
console.log("Jackpot+: popup loaded.")

// Theme options
const themeOptions = document.querySelectorAll(".theme-option")

// Get current theme from storage
async function getCurrentTheme() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["jackpot_plus_theme"], (result) => {
      resolve(result.jackpot_plus_theme || "plain")
    })
  })
}

// Set theme in storage
async function setTheme(themeName) {
  // apply to popup immediately
  try { document.documentElement.setAttribute('data-jp-theme', themeName); } catch (e) {}
  return new Promise((resolve) => {
    chrome.storage.sync.set({ jackpot_plus_theme: themeName }, () => {
      console.log("Jackpot+: Theme set to", themeName)
      resolve(true)
    })
  })
}

// Update UI to reflect selected theme
function updateSelection(selectedTheme) {
  themeOptions.forEach((option) => {
    const theme = option.dataset.theme
    if (theme === selectedTheme) {
      option.classList.add("selected")
    } else {
      option.classList.remove("selected")
    }
  })
}

// Initialize popup
async function initPopup() {
  const currentTheme = await getCurrentTheme()
  try { document.documentElement.setAttribute('data-jp-theme', currentTheme); } catch (e) {}
  updateSelection(currentTheme)
  console.log("Jackpot+: Current theme:", currentTheme)
}

// Handle theme selection
themeOptions.forEach((option) => {
  option.addEventListener("click", async () => {
    const theme = option.dataset.theme
    await setTheme(theme)
    updateSelection(theme)
    try { document.documentElement.setAttribute('data-jp-theme', theme); } catch (e) {}
  })
})

// Initialize on load
initPopup()
