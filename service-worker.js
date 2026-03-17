// Service worker for Jackpot+

chrome.runtime.onInstalled.addListener(() => {
  console.log("Jackpot+: extension installed.")
})

// Track last injection time per tab to prevent rapid re-injections
const lastInjectionTime = {}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "resetDeck") {
    const tabId = sender.tab?.id
    const now = Date.now()
    const lastTime = lastInjectionTime[tabId] || 0

    // Debounce: skip if injected within 1s for the same tab
    if (now - lastTime < 1000) {
      console.log("Jackpot+: resetDeck debounced for tab", tabId)
      sendResponse({ success: true, debounced: true })
      return false
    }

    lastInjectionTime[tabId] = now
    console.log("Jackpot+: resetDeck received, injecting page-script.js into tab", tabId)
    // First reset the lifecycle guard, then inject page-script.js
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        world: "MAIN",
        func: () => {
          window.__jackpotDeckInitDone = false
        },
      })
      .then(() =>
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          world: "MAIN",
          files: ["page-script.js"],
        }),
      )
      .then(() => {
        console.log("Jackpot+: page-script.js injected successfully")
        sendResponse({ success: true })
      })
      .catch(err => {
        console.error("Jackpot+: Failed to execute script:", err)
        sendResponse({ success: false, error: err.message })
      })
    return true // Keep message channel open for async response
  }
})
