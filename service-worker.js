// Service worker for Jackpot+

chrome.runtime.onInstalled.addListener(() => {
  console.log("Jackpot+: extension installed.")
})

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "resetDeck") {
    console.log("Jackpot+: resetDeck received, injecting page-script.js into tab", sender.tab?.id)
    // Execute the page-script.js file in MAIN world to reset deckInitialized flag
    chrome.scripting
      .executeScript({
        target: { tabId: sender.tab.id },
        world: "MAIN",
        files: ["page-script.js"],
      })
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
