// Jackpot+ — Deck transformation (card grid → simple list)
console.log("Jackpot+: deck module loaded.")


function transformDeck(retryCount = 0) {
  const deckTable = document.querySelector(".deck-table")

  if (!deckTable) {
    if (retryCount < 6) {
      console.log(`Jackpot+: deck table not found, retrying (${retryCount + 1}/6)...`)
      setTimeout(() => transformDeck(retryCount + 1), 300)
    } else {
      // Fallback: observe .deck-page for .deck-table being added
      const deckPage = document.querySelector('.deck-page')
      if (deckPage && !deckPage.__jpWaitingForDeckTable) {
        deckPage.__jpWaitingForDeckTable = true
        console.log('Jackpot+: .deck-table missing, observing .deck-page for deck table...')
        const mo = new MutationObserver((mutations, obs) => {
          if (deckPage.querySelector('.deck-table')) {
            obs.disconnect()
            deckPage.__jpWaitingForDeckTable = false
            setTimeout(() => transformDeck(), 50)
          }
        })
        mo.observe(deckPage, { childList: true, subtree: true })
        // Safety: stop after 10s
        setTimeout(() => {
          if (deckPage.__jpWaitingForDeckTable) {
            try { mo.disconnect() } catch (e) {}
            deckPage.__jpWaitingForDeckTable = false
            console.log('Jackpot+: timed out waiting for .deck-table (10s)')
          }
        }, 10000)
      } else {
        console.log("Jackpot+: deck table not found after retries, waiting for DOM changes")
      }
    }
    return
  }

  const cardsTrack = deckTable.querySelector("#cardsTrack")
  const cards = cardsTrack ? Array.from(cardsTrack.querySelectorAll(".card-slot-filled")) : []

  // If we don't yet have cardsTrack or any filled cards, observe the deckTable
  // for incoming nodes instead of aggressive polling. This is more reliable
  // when the page loads parts of the deck asynchronously.
  if (!cardsTrack || cards.length === 0) {
    if (!deckTable.__jpWaitingForCards) {
      deckTable.__jpWaitingForCards = true
      console.log('Jackpot+: waiting for cards to appear in deckTable (observer)')

      const mo = new MutationObserver((mutations, obs) => {
        const ct = deckTable.querySelector('#cardsTrack')
        const filled = ct ? ct.querySelectorAll('.card-slot-filled') : []
        if (ct && filled.length > 0) {
          obs.disconnect()
          deckTable.__jpWaitingForCards = false
          // slight delay to let any rendering settle, then try again
          setTimeout(() => transformDeck(), 80)
        }
      })

      mo.observe(deckTable, { childList: true, subtree: true })

      // Safety timeout: give up observing after 5s and log state
      setTimeout(() => {
        if (deckTable.__jpWaitingForCards) {
          try { mo.disconnect() } catch (e) {}
          deckTable.__jpWaitingForCards = false
          console.log('Jackpot+: timed out waiting for deck cards (5s), will not retry until next navigation')
        }
      }, 5000)
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
