// Content script for Jackpot+ — simplifies the deck view
console.log("Jackpot+: content script loaded.")

// Inject CSS directly
function injectStyles() {
  const style = document.createElement("style")
  style.textContent = `
    /* Strip the roses background — target every likely container */
    html,
    body,
    body.deck-body,
    .deck-page,
    .deck-page::before,
    .deck-page::after,
    body::before,
    body::after {
      background-image: none !important;
      background: #f8fafc !important;
    }
  `
  document.head.appendChild(style)

  // Also force it via JS in case it's an inline style
  function forceBackground() {
    const targets = [document.documentElement, document.body]
    const extra = document.querySelectorAll(".deck-page, .deck-body")
    extra.forEach(el => targets.push(el))
    targets.forEach(el => {
      if (el) {
        el.style.setProperty("background-image", "none", "important")
        el.style.setProperty("background", "#f8fafc", "important")
      }
    })
  }

  forceBackground()
  // Run again after a short delay in case the page sets it dynamically
  setTimeout(forceBackground, 300)
  setTimeout(forceBackground, 1000)

  console.log("Jackpot+: styles injected")
}

// Transform the fancy card deck into a simple list
function transformDeck() {
  const deckTable = document.querySelector(".deck-table")

  if (!deckTable) {
    console.log("Jackpot+: deck table not found, retrying...")
    setTimeout(transformDeck, 500)
    return
  }

  const cardsTrack = deckTable.querySelector("#cardsTrack")
  if (!cardsTrack) return

  // Get all filled cards
  const cards = Array.from(cardsTrack.querySelectorAll(".card-slot-filled"))

  if (cards.length === 0) return

  // Create a simple list
  const listContainer = document.createElement("div")
  listContainer.className = "jackpot-simple-list"

  const title = document.createElement("h2")
  title.textContent = "Your Projects"
  listContainer.appendChild(title)

  const list = document.createElement("ul")
  list.className = "project-list"

  cards.forEach(card => {
    const projectName = card.dataset.projectName || "Unnamed"
    const projectDescription = card.dataset.projectDescription || ""
    const projectType = card.dataset.projectType || "Software"
    const projectHours = parseFloat(card.dataset.projectHours || "0").toFixed(1)
    const isShipped = card.dataset.projectShipped === "true"
    const codeUrl = card.dataset.codeUrl || ""
    const playableUrl = card.dataset.playableUrl || ""
    const bannerUrl = card.dataset.bannerUrl || ""

    const listItem = document.createElement("li")
    listItem.className = "project-item"

    // Type icon mapping
    const typeIcons = {
      Software: "⚡",
      Art: "🎨",
      Hardware: "🔧",
      Game: "🎮",
      default: "📁"
    }
    const typeIcon = typeIcons[projectType] || typeIcons.default

    let html = `
      <div class="project-card ${isShipped ? 'project-shipped' : ''}">
        ${bannerUrl ? `<div class="project-banner" style="background-image: url('${bannerUrl}')"></div>` : `<div class="project-banner project-banner-placeholder">${typeIcon}</div>`}
        <div class="project-content">
          <div class="project-header">
            <span class="project-type-badge project-type-${projectType.toLowerCase()}">${projectType}</span>
            ${isShipped ? '<span class="shipped-badge">✓ Shipped</span>' : ''}
          </div>
          <h3 class="project-name">${projectName}</h3>
          ${projectDescription ? `<p class="project-description">${projectDescription}</p>` : ''}
          <div class="project-footer">
            <div class="project-hours-display">
              <span class="hours-value">${projectHours}</span>
              <span class="hours-label">hours</span>
            </div>
            <div class="project-links">
              ${playableUrl ? `<a href="${playableUrl}" target="_blank" class="project-link project-link-play" title="Play">▶ Play</a>` : ''}
              ${codeUrl ? `<a href="${codeUrl}" target="_blank" class="project-link project-link-code" title="View Code">⟨/⟩ Code</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `
    listItem.innerHTML = html
    list.appendChild(listItem)
  })

  listContainer.appendChild(list)

  // Replace the deck table with the simple list
  deckTable.parentNode.replaceChild(listContainer, deckTable)
  console.log("Jackpot+: deck transformed successfully")
}

// Start immediately and retry if needed
injectStyles()
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", transformDeck)
} else {
  transformDeck()
}
