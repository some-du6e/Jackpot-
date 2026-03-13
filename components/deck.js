// Jackpot+ — Deck transformation (card grid → simple list)
console.log("Jackpot+: deck module loaded.")

function transformDeck(retryCount = 0) {
  const deckTable = document.querySelector(".deck-table")

  if (!deckTable) {
    if (retryCount < 20) {
      console.log(`Jackpot+: deck table not found, retrying (${retryCount + 1}/20)...`)
      setTimeout(() => transformDeck(retryCount + 1), 250)
    } else {
      console.log("Jackpot+: deck table not found after 20 retries, giving up")
    }
    return
  }

  const cardsTrack = deckTable.querySelector("#cardsTrack")
  if (!cardsTrack) {
    if (retryCount < 20) {
      console.log(`Jackpot+: cardsTrack not found, retrying (${retryCount + 1}/20)...`)
      setTimeout(() => transformDeck(retryCount + 1), 250)
    }
    return
  }

  const cards = Array.from(cardsTrack.querySelectorAll(".card-slot-filled"))

  if (cards.length === 0) {
    if (retryCount < 20) {
      console.log(`Jackpot+: no filled cards yet, retrying (${retryCount + 1}/20)...`)
      setTimeout(() => transformDeck(retryCount + 1), 250)
    } else {
      console.log("Jackpot+: no filled cards found after 20 retries, deck may be empty")
    }
    return
  }

  const listContainer = document.createElement("div")
  listContainer.className = "jackpot-simple-list"

  const title = document.createElement("h2")
  title.textContent = "Your Projects"
  listContainer.appendChild(title)

  const list = document.createElement("ul")
  list.className = "project-list"

  cards.forEach((card, index) => {
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
    listItem.style.setProperty("--item-index", String(index))

    const typeIcons = {
      Software: "⚡",
      Art: "🎨",
      Hardware: "🔧",
      Game: "🎮",
      default: "📁",
    }
    const typeIcon = typeIcons[projectType] || typeIcons.default

    let html = `
      <div class="project-card ${isShipped ? "project-shipped" : ""}">
        ${bannerUrl ? `<div class="project-banner" style="background-image: url('${bannerUrl}')"></div>` : `<div class="project-banner project-banner-placeholder">${typeIcon}</div>`}
        <div class="project-content">
          <div class="project-header">
            <span class="project-type-badge project-type-${projectType.toLowerCase()}">${projectType}</span>
            ${isShipped ? '<span class="shipped-badge">✓ Shipped</span>' : ""}
          </div>
          <h3 class="project-name">${projectName}</h3>
          ${projectDescription ? `<p class="project-description">${projectDescription}</p>` : ""}
          <div class="project-footer">
            <div class="project-hours-display">
              <span class="hours-value">${projectHours}</span>
              <span class="hours-label">hours</span>
            </div>
            <div class="project-links">
              ${playableUrl ? `<a href="${playableUrl}" target="_blank" class="project-link project-link-play" title="Play">▶ Play</a>` : ""}
              ${codeUrl ? `<a href="${codeUrl}" target="_blank" class="project-link project-link-code" title="View Code">⟨/⟩ Code</a>` : ""}
            </div>
          </div>
        </div>
      </div>
    `
    listItem.innerHTML = html
    list.appendChild(listItem)
  })

  listContainer.appendChild(list)

  deckTable.parentNode.replaceChild(listContainer, deckTable)

  // Save stats so toolbar shows correct values on other pages
  const tokenCountEl = document.querySelector(".token-count")
  const chipsVal = tokenCountEl ? tokenCountEl.textContent.trim() : loadStats().chips
  const totalHrs = cards.reduce(
    (sum, card) => sum + parseFloat(card.dataset.projectHours || "0"),
    0,
  )
  saveStats(chipsVal, totalHrs.toFixed(1))

  console.log("Jackpot+: deck transformed successfully")
}
