// Jackpot+ — Legacy inline style cleanup / sanitizer
console.log("Jackpot+: cleanup module loaded.")

function cleanupLegacyInlineOverrides() {
  const selectors = ["body.deck-body", ".deck-page", ".jackpot-simple-list"]
  const props = [
    "background",
    "background-image",
    "border",
    "box-shadow",
    "height",
    "max-height",
    "min-height",
    "overflow",
    "width",
    "max-width",
    "margin",
  ]

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      const legacySignature = [
        "box-shadow: none",
        "height: auto",
        "max-height: none",
        "min-height: 0",
        "overflow: visible",
        "width: 100%",
      ]
      const styleAttr = (el.getAttribute("style") || "").toLowerCase()
      const looksLikeLegacyOverride = legacySignature.every(token => styleAttr.includes(token))

      if (looksLikeLegacyOverride) {
        el.removeAttribute("style")
        return
      }

      props.forEach(prop => el.style.removeProperty(prop))
      if (!el.getAttribute("style")) {
        el.removeAttribute("style")
      }
    })
  })
}

function startInlineOverrideSanitizer() {
  const runCleanup = () => cleanupLegacyInlineOverrides()
  let cleanupScheduled = false
  let burstIntervalId = null

  const scheduleCleanup = () => {
    if (cleanupScheduled) return
    cleanupScheduled = true
    requestAnimationFrame(() => {
      cleanupScheduled = false
      runCleanup()
    })
  }

  runCleanup()
  setTimeout(runCleanup, 100)
  setTimeout(runCleanup, 500)
  setTimeout(runCleanup, 1000)

  burstIntervalId = setInterval(runCleanup, 250)
  setTimeout(() => {
    if (burstIntervalId) {
      clearInterval(burstIntervalId)
      burstIntervalId = null
    }
  }, 10000)

  document.addEventListener("turbo:load", scheduleCleanup)
  document.addEventListener("DOMContentLoaded", scheduleCleanup)
  window.addEventListener("pageshow", scheduleCleanup)

  const observer = new MutationObserver(() => {
    scheduleCleanup()
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"],
    childList: true,
    subtree: true,
  })
}
