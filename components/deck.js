console.log("Jackpot+: deck module loaded.")

function transformDeck() {
  const deckTable = document.querySelector(".deck-table")
  if (!deckTable) {
    console.error("Jackpot+: deck table not found")
    return
  }

  const cardsTrack = deckTable.querySelector("#cardsTrack")
  const cards = cardsTrack ? Array.from(cardsTrack.querySelectorAll(".card-slot-filled")) : []

  const listContainer = document.createElement("div")
  listContainer.className = "jackpot-simple-list"

  // Header with title and add button
  const headerBar = document.createElement("div")
  headerBar.className = "jp-deck-header"

  const title = document.createElement("h2")
  title.textContent = "Your Projects"
  headerBar.appendChild(title)

  // Find the original Add Project button to clone its functionality
  const originalAddBtn = document.querySelector(
    '.deck-add-btn, .add-project-btn, button[data-action="add-project"]',
  )

  const addBtn = document.createElement("button")
  addBtn.className = "jp-add-project-btn"
  addBtn.setAttribute("aria-label", "Add a new project")
  addBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <span>Add Project</span>
  `
  addBtn.addEventListener("click", () => {
    // Try to click the original add button if it exists
    if (originalAddBtn) {
      originalAddBtn.click()
    } else {
      // Fallback: look for any button with "Add" text or trigger the modal
      const addButtons = Array.from(document.querySelectorAll("button")).filter(
        btn =>
          btn.textContent.trim().toLowerCase().includes("add") &&
          btn.textContent.trim().toLowerCase().includes("project"),
      )
      if (addButtons.length > 0) {
        addButtons[0].click()
      } else {
        console.log("Jackpot+: Could not find original Add Project button")
      }
    }
  })
  headerBar.appendChild(addBtn)

  listContainer.appendChild(headerBar)

  const list = document.createElement("ul")
  list.className = "project-list"
  list.setAttribute("role", "list")
  list.setAttribute("aria-label", "Your projects")

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

    // Add click handler to open detail modal
    const projectCard = listItem.querySelector(".project-card")
    if (projectCard) {
      projectCard.style.cursor = "pointer"
      projectCard.addEventListener("click", e => {
        // Don't open modal if clicking a link
        if (e.target.closest(".project-link")) return

        // Try to click the original card to trigger the site's modal
        if (card) {
          card.click()
        }
      })
    }
  })

  // Show empty state if no projects
  if (cards.length === 0) {
    const emptyState = document.createElement("div")
    emptyState.className = "jp-empty-state"
    emptyState.innerHTML = `
      <div class="jp-empty-state-icon">📋</div>
      <div class="jp-empty-state-title">No projects yet</div>
      <p class="jp-empty-state-text">Click "Add Project" to start tracking your work and earning chips.</p>
    `
    listContainer.appendChild(emptyState)
  } else {
    listContainer.appendChild(list)
  }

  // Hide the original deck table and insert our list after it
  deckTable.style.display = "none"
  deckTable.parentNode.insertBefore(listContainer, deckTable.nextSibling)

  // Hide any original Add Project buttons that might be visible
  const addProjectBtns = document.querySelectorAll(
    '.deck-add-btn, .add-project-btn, button[data-action="add-project"]',
  )
  addProjectBtns.forEach(btn => {
    btn.style.display = "none"
  })

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
