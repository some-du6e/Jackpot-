// Jackpot+ — Shop transformation (visual only, no goal tracking)
console.log("Jackpot+: shop module loaded.")

function injectShopIcons() {
  const iconMap = {
    "Add Prize": "add-prize.svg",
    "Shop Rules": "shop-rules.svg",
    Buy: "buy.svg",
    Generic: "generic.svg",
    Setup: "setup.svg",
    Hardware: "hardware.svg",
    "Las Vegas": "las-vegas.svg",
  }

  const shopTransformed = document.querySelector(".jp-shop-container")
  const buttons = document.querySelectorAll("button")
  buttons.forEach(btn => {
    const text = btn.textContent.trim()
    // Skip Add Prize / Shop Rules if shop is transformed (they're in the header now)
    if (shopTransformed && (text === "Add Prize" || text === "Shop Rules")) return

    const iconFile = iconMap[text]
    if (iconFile && !btn.querySelector(".jp-icon")) {
      const img = document.createElement("img")
      img.src = chrome.runtime.getURL(`icons/${iconFile}`)
      img.className = "jp-icon"
      img.style.width = "18px"
      img.style.height = "18px"
      img.style.marginRight = "6px"
      img.style.verticalAlign = "middle"
      btn.prepend(img)
    }
  })
}

function transformShop(retryCount = 0) {
  if (!document.body.classList.contains("shop-body")) return

  const shopRight = document.querySelector(".shop-right")
  if (!shopRight) {
    if (retryCount < 20) {
      console.log(`Jackpot+: shop-right not found, retrying (${retryCount + 1}/20)...`)
      setTimeout(() => transformShop(retryCount + 1), 250)
    } else {
      console.log("Jackpot+: shop-right not found after 20 retries, giving up")
      // Show error state
      const errorState = document.createElement("div")
      errorState.className = "jp-error-state"
      errorState.innerHTML = `
        <div class="jp-error-state-icon">⚠️</div>
        <div class="jp-error-state-title">Could not load shop</div>
        <p class="jp-error-state-text">Try refreshing the page.</p>
      `
      document.body.appendChild(errorState)
    }
    return
  }

  if (document.querySelector(".jp-shop-container")) return

  const panels = document.querySelectorAll(".shop-category-panel")
  const allItems = []
  const categoryMap = {
    generic: "Generic",
    setup: "Setup",
    hardware: "Hardware",
    las_vegas: "Las Vegas",
  }

  panels.forEach(panel => {
    const category = panel.dataset.shopCategoryPanel || "generic"
    const cards = panel.querySelectorAll(".shop-card")
    cards.forEach(card => {
      const buyBtn = card.querySelector(".shop-buy-btn")
      if (!buyBtn) return
      const desc = buyBtn.dataset.itemDesc || ""
      const dollarMatch = desc.match(/\$(\d+(?:\.\d+)?)/)
      const dollarAmount = dollarMatch ? `$${dollarMatch[1]}` : ""

      allItems.push({
        id: buyBtn.dataset.itemId,
        name: buyBtn.dataset.itemName || "Unknown",
        price: parseFloat(buyBtn.dataset.itemPrice || "0"),
        category: category,
        categoryLabel: categoryMap[category] || category,
        image: buyBtn.dataset.itemImage || "",
        desc: desc,
        dollarAmount: dollarAmount,
      })
    })
  })

  allItems.sort((a, b) => a.price - b.price)

  const container = document.createElement("div")
  container.className = "jp-shop-container"

  // Shop header with title and action buttons
  const headerBar = document.createElement("div")
  headerBar.className = "jp-shop-header"

  const headerTitle = document.createElement("h2")
  headerTitle.className = "jp-shop-header-title"
  headerTitle.textContent = "Shop"
  headerBar.appendChild(headerTitle)

  const headerActions = document.createElement("div")
  headerActions.className = "jp-shop-header-actions"

  // Grab original Add Prize and Shop Rules buttons
  const originalButtons = document.querySelectorAll("button")
  const actionButtonNames = ["Add Prize", "Shop Rules"]
  const actionButtons = []

  originalButtons.forEach(btn => {
    const text = btn.textContent.trim()
    if (actionButtonNames.includes(text)) {
      actionButtons.push({ text, original: btn })
    }
  })

  actionButtons.forEach(({ text, original }) => {
    const newBtn = document.createElement("button")
    newBtn.className = "jp-shop-action-btn"
    newBtn.dataset.action = text.toLowerCase().replace(/\s+/g, "-")
    newBtn.setAttribute("aria-label", text)

    const iconFile = text === "Add Prize" ? "add-prize.svg" : "shop-rules.svg"
    const img = document.createElement("img")
    img.src = chrome.runtime.getURL(`icons/${iconFile}`)
    img.className = "jp-icon"
    newBtn.appendChild(img)

    const span = document.createElement("span")
    span.textContent = text
    newBtn.appendChild(span)

    newBtn.addEventListener("click", () => original.click())

    headerActions.appendChild(newBtn)

    // Hide the original button
    original.style.display = "none"
  })

  headerBar.appendChild(headerActions)
  container.appendChild(headerBar)

  // Goals section
  const goalsSection = document.createElement("div")
  goalsSection.className = "jp-goals-section"
  container.appendChild(goalsSection)

  // Filter bar
  const filterBar = document.createElement("div")
  filterBar.className = "jp-shop-filters"

  const categories = ["all", "generic", "setup", "hardware", "las_vegas"]
  const categoryLabels = { all: "All", ...categoryMap }
  const categoryIcons = {
    all: "buy.svg",
    generic: "generic.svg",
    setup: "setup.svg",
    hardware: "hardware.svg",
    las_vegas: "las-vegas.svg",
  }

  categories.forEach(cat => {
    const btn = document.createElement("button")
    btn.className = "jp-shop-filter-btn"
    btn.dataset.filter = cat
    btn.setAttribute("aria-label", `Filter by ${categoryLabels[cat]}`)

    const img = document.createElement("img")
    img.src = chrome.runtime.getURL(`icons/${categoryIcons[cat]}`)
    img.className = "jp-icon"
    btn.appendChild(img)

    const span = document.createElement("span")
    span.textContent = categoryLabels[cat]
    btn.appendChild(span)

    btn.addEventListener("click", () => {
      const wasActive = btn.classList.contains("jp-shop-filter-active")
      filterBar
        .querySelectorAll(".jp-shop-filter-btn")
        .forEach(b => b.classList.remove("jp-shop-filter-active"))

      const items = container.querySelectorAll(".jp-shop-item")
      if (wasActive) {
        items.forEach(item => (item.style.display = ""))
      } else {
        btn.classList.add("jp-shop-filter-active")
        let visibleCount = 0
        items.forEach(item => {
          const matches = cat === "all" || item.dataset.category === cat
          item.style.display = matches ? "" : "none"
          if (matches) visibleCount++
        })
        // Show empty state if no items match filter
        toggleEmptyState(visibleCount === 0)
      }
    })

    filterBar.appendChild(btn)
  })

  container.appendChild(filterBar)

  // Sort bar
  const sortBar = document.createElement("div")
  sortBar.className = "jp-shop-sort"

  const sortLabel = document.createElement("span")
  sortLabel.className = "jp-shop-sort-label"
  sortLabel.textContent = "Sort by"
  sortBar.appendChild(sortLabel)

  const sortSelect = document.createElement("select")
  sortSelect.className = "jp-shop-sort-select"
  sortSelect.innerHTML = `
    <option value="value">Value</option>
    <option value="price">Price</option>
  `
  sortBar.appendChild(sortSelect)

  const sortDirBtn = document.createElement("button")
  sortDirBtn.className = "jp-shop-sort-dir"
  sortDirBtn.dataset.dir = "desc"
  sortDirBtn.textContent = "↓"
  sortDirBtn.title = "Descending"
  sortBar.appendChild(sortDirBtn)

  container.appendChild(sortBar)

  // Item grid
  const grid = document.createElement("div")
  grid.className = "jp-shop-grid"
  grid.setAttribute("role", "list")
  grid.setAttribute("aria-label", "Shop items")

  allItems.forEach((item, index) => {
    const el = document.createElement("div")
    el.className = "jp-shop-item"
    el.dataset.category = item.category
    el.dataset.price = item.price
    el.dataset.dollar = item.dollarAmount ? item.dollarAmount.replace("$", "") : "0"
    el.style.setProperty("--item-index", String(index))

    const hoursAmount = (item.price / 50).toFixed(1)
    const priceHtml = item.dollarAmount
      ? item.price.toLocaleString() +
        ' chips <span class="jp-shop-item-dollar">(' +
        item.dollarAmount +
        " / " +
        hoursAmount +
        "h)</span>"
      : item.price.toLocaleString() +
        ' chips <span class="jp-shop-item-dollar">(' +
        hoursAmount +
        "h)</span>"

    el.innerHTML = `
      <div class="jp-shop-item-card">
        ${item.image ? `<div class="jp-shop-item-image" style="background-image: url('${item.image}')"></div>` : ""}
        <div class="jp-shop-item-content">
          <span class="jp-shop-item-category jp-cat-${item.category}">${item.categoryLabel}</span>
          <h3 class="jp-shop-item-name">${item.name}</h3>
          <div class="jp-shop-item-footer">
            <span class="jp-shop-item-price">${priceHtml}</span>
            <div class="jp-shop-item-actions">
              <button class="jp-shop-goal-btn" data-item-id="${item.id}" data-item-price="${item.price}" aria-label="Set as goal">🎯</button>
              <button class="jp-shop-buy-btn" data-item-id="${item.id}">Buy</button>
            </div>
          </div>
        </div>
      </div>
    `

    el.querySelector(".jp-shop-buy-btn").addEventListener("click", () => {
      const originalBtn = document.querySelector(`.shop-buy-btn[data-item-id="${item.id}"]`)
      if (originalBtn) originalBtn.click()
    })

    // Goal button
    const goalBtn = el.querySelector(".jp-shop-goal-btn")
    if (typeof hasGoal === "function" && hasGoal(item.id)) {
      goalBtn.classList.add("jp-shop-goal-active")
      goalBtn.title = "Goal set — click to remove"
    } else {
      goalBtn.title = "Set as goal"
    }

    goalBtn.addEventListener("click", () => {
      if (
        typeof hasGoal !== "function" ||
        typeof setGoal !== "function" ||
        typeof removeGoal !== "function"
      )
        return

      if (hasGoal(item.id)) {
        removeGoal(item.id)
        goalBtn.classList.remove("jp-shop-goal-active")
        goalBtn.title = "Set as goal"
      } else {
        // Use toolbar hours as the existingHours source (stored in localStorage by toolbar)
        let existingHoursForItem = 0
        try {
          const raw = localStorage.getItem("jackpot_plus_stats")
          if (raw) {
            const parsed = JSON.parse(raw)
            existingHoursForItem = parseFloat(parsed.hours || "0") || 0
            console.log("Jackpot+: using toolbar hours for existingHoursForItem", {
              itemId: item.id,
              name: item.name,
              existingHoursForItem,
            })
          }
        } catch (e) {
          console.warn("Jackpot+: could not read toolbar hours from localStorage", e)
        }

        // Prompt for break days (optional quick input)
        let breakDays = 0
        try {
          const input = prompt(
            "Break days (days off not counted towards deadline)? Enter a number:",
            "0",
          )
          if (input !== null) {
            const parsed = parseInt(input, 10)
            if (!isNaN(parsed) && parsed >= 0) breakDays = parsed
          }
        } catch (e) {}

        // If none found for this item, fall back to 0 (user can still set manually later)
        console.log("Jackpot+: setting goal", {
          itemId: item.id,
          name: item.name,
          price: item.price,
          breakDays,
          existingHoursForItem,
        })
        setGoal(item.id, item.price, breakDays, existingHoursForItem)
        goalBtn.classList.add("jp-shop-goal-active")
        goalBtn.title = "Goal set — click to remove"
      }

      // Re-render goals section
      if (typeof renderGoalsSection === "function") {
        renderGoalsSection(container)
      }
    })

    grid.appendChild(el)
  })

  container.appendChild(grid)

  // Empty state for filters
  const emptyState = document.createElement("div")
  emptyState.className = "jp-empty-state"
  emptyState.style.display = "none"
  emptyState.innerHTML = `
    <div class="jp-empty-state-icon">🔍</div>
    <div class="jp-empty-state-title">No items found</div>
    <p class="jp-empty-state-text">Try selecting a different category.</p>
  `
  container.appendChild(emptyState)

  function toggleEmptyState(show) {
    emptyState.style.display = show ? "flex" : "none"
    grid.style.display = show ? "none" : ""
  }

  // Sort logic
  function sortItems() {
    const sortBy = sortSelect.value
    const dir = sortDirBtn.dataset.dir === "asc" ? 1 : -1
    const items = Array.from(grid.querySelectorAll(".jp-shop-item"))

    items.sort((a, b) => {
      const priceA = parseFloat(a.dataset.price)
      const priceB = parseFloat(b.dataset.price)
      const dollarA = parseFloat(a.dataset.dollar) || 0
      const dollarB = parseFloat(b.dataset.dollar) || 0

      if (sortBy === "value") {
        const valA = dollarA > 0 ? priceA / dollarA : Infinity
        const valB = dollarB > 0 ? priceB / dollarB : Infinity
        return (valA - valB) * dir
      } else {
        return (priceA - priceB) * dir
      }
    })

    items.forEach((item, i) => {
      item.style.setProperty("--item-index", String(i))
      grid.appendChild(item)
    })
  }

  sortSelect.addEventListener("change", sortItems)
  sortDirBtn.addEventListener("click", () => {
    const isAsc = sortDirBtn.dataset.dir === "asc"
    sortDirBtn.dataset.dir = isAsc ? "desc" : "asc"
    sortDirBtn.textContent = isAsc ? "↓" : "↑"
    sortDirBtn.title = isAsc ? "Descending" : "Ascending"
    sortItems()
  })

  shopRight.appendChild(container)

  // Render goals section
  renderGoalsSection(container)

  console.log(`Jackpot+: shop transformed with ${allItems.length} items`)
}

// Render the goals section
function renderGoalsSection(container) {
  const goalsSection = container.querySelector(".jp-goals-section")
  if (!goalsSection) return

  if (typeof loadGoals !== "function" || typeof getDaysRemaining !== "function") {
    goalsSection.style.display = "none"
    return
  }

  const goals = loadGoals()
  const goalIds = Object.keys(goals)
  const totalDays = getDaysRemaining()

  console.log("Jackpot+: renderGoalsSection called", { goalIds, totalDays })

  // Get all shop items for name lookup
  const shopItems = {}
  container.querySelectorAll(".jp-shop-item").forEach(el => {
    const btn = el.querySelector(".jp-shop-goal-btn")
    if (btn) {
      const id = btn.dataset.itemId
      const name = el.querySelector(".jp-shop-item-name")?.textContent || "Unknown"
      shopItems[id] = { name, price: parseFloat(btn.dataset.price || "0") }
    }
  })

  if (goalIds.length === 0 && totalDays <= 0) {
    goalsSection.style.display = "none"
    return
  }

  goalsSection.style.display = ""

  let html = `
    <div class="jp-goals-header">
      <h3 class="jp-goals-title">🎯 Goals</h3>
      <div class="jp-deadline-input">
        <label for="jp-deadline">Deadline:</label>
        <input type="date" id="jp-deadline" class="jp-deadline-date" />
        <span class="jp-days-remaining">${totalDays}d left</span>
      </div>
    </div>
  `

  if (goalIds.length === 0) {
    html += `
      <div class="jp-goals-empty">
        <p>No goals set. Click 🎯 on a shop item to set a goal.</p>
      </div>
    `
  } else {
    html += `<div class="jp-goals-list">`
    goalIds.forEach(itemId => {
      const goal = goals[itemId]
      const item = shopItems[itemId] || { name: itemId, price: goal.price }
      const hoursPerDay =
        typeof getHoursPerDay === "function" ? getHoursPerDay(goal, totalDays) : "?"
      const chipsPerDay =
        typeof getChipsPerDay === "function" ? getChipsPerDay(goal, totalDays) : "?"

      // Determine progress percent using current toolbar hours
      let currentTotalHours = 0
      try {
        const raw = localStorage.getItem("jackpot_plus_stats")
        if (raw) {
          const parsed = JSON.parse(raw)
          currentTotalHours = parseFloat(parsed.hours || "0") || 0
        }
      } catch (e) {}

      // Calculate progress: how much of the original goal is done
      // originalPrice is the full price in chips, existingHours was already done when goal was set
      const originalChips = goal.originalPrice || goal.price + (goal.existingHours || 0) * 50
      const originalHours = originalChips / 50

      // Progress = current total hours / original hours
      // existingHours is the hours that were already done when the goal was set
      // So if existingHours = 11 and currentTotalHours = 12, we've done 1 hour since setting the goal
      // But the total progress is still currentTotalHours / originalHours
      const percent =
        originalHours > 0 ? Math.min(100, Math.round((currentTotalHours / originalHours) * 100)) : 0

      // Smart goal display (include break days when present)
      let statsText = ""
      const breakTxt =
        goal.breakDays && goal.breakDays > 0
          ? ` • ${goal.breakDays} break day${goal.breakDays > 1 ? "s" : ""}`
          : ""

      const originalHoursDisplay = (originalChips / 50).toFixed(1)
      const remainingChips = goal.price || 0
      const remainingHours = (remainingChips / 50).toFixed(1)
      // Dollar conversion: $6.00 per hour -> 50 chips = 1 hour => $ per chip
      const dollarPerChip = 6 / 50
      const originalDollars = (originalChips * dollarPerChip).toFixed(2)
      const remainingDollars = (remainingChips * dollarPerChip).toFixed(2)
      const dollarsPerDay = (chipsPerDay * dollarPerChip).toFixed(2)
      statsText = `${originalHoursDisplay}h total ($${originalDollars}) • ${currentTotalHours.toFixed(
        1,
      )}h done • ${remainingHours}h left ($${remainingDollars}) • ${chipsPerDay}/day ($${dollarsPerDay})${breakTxt}`

      html += `
        <div class="jp-goal-item" data-item-id="${itemId}">
          <div class="jp-goal-info">
            <span class="jp-goal-name">${item.name}</span>
            <span class="jp-goal-stats">${statsText}</span>
            <div class="jp-goal-progress-wrap">
              <div class="jp-goal-progress" style="width: ${percent}%"></div>
            </div>
            <div class="jp-goal-progress-text">${percent}%</div>
          </div>
          <div class="jp-goal-actions">
            <button class="jp-goal-edit" data-item-id="${itemId}" aria-label="Edit goal">
              <svg class="jp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <button class="jp-goal-remove" data-item-id="${itemId}" aria-label="Remove goal">✕</button>
          </div>
        </div>
      `
    })
    html += `</div>`
  }

  goalsSection.innerHTML = html

  // Set deadline input value
  const deadlineInput = goalsSection.querySelector("#jp-deadline")
  if (deadlineInput) {
    const deadline = typeof getDeadline === "function" ? getDeadline() : null
    if (deadline) {
      deadlineInput.value = deadline.toISOString().split("T")[0]
    }

    deadlineInput.addEventListener("change", () => {
      if (typeof saveDeadline !== "function") return
      const date = new Date(deadlineInput.value + "T00:00:00")
      if (!isNaN(date.getTime())) {
        saveDeadline(date)
        renderGoalsSection(container)
      }
    })
  }

  // Remove goal buttons
  goalsSection.querySelectorAll(".jp-goal-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      if (typeof removeGoal !== "function") return
      const itemId = btn.dataset.itemId
      removeGoal(itemId)

      // Update goal button in grid
      const goalBtn = container.querySelector(`.jp-shop-goal-btn[data-item-id="${itemId}"]`)
      if (goalBtn) {
        goalBtn.classList.remove("jp-shop-goal-active")
        goalBtn.title = "Set as goal"
      }

      renderGoalsSection(container)
    })
  })

    // Edit goal buttons (edit price via modal)
    goalsSection.querySelectorAll(".jp-goal-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        if (typeof loadGoals !== "function" || typeof saveGoals !== "function") return
        const itemId = btn.dataset.itemId
        const goals = loadGoals()
        const goal = goals[itemId]
        if (!goal) return

        const itemName = container.querySelector(`.jp-goal-item[data-item-id="${itemId}"] .jp-goal-name`)?.textContent || itemId
        const currentChips = goal.price || 0
        const currentHours = currentChips / 50
        const currentDollars = currentHours * 6

        // Get original shop item price for reset
        const goalBtnInGrid = container.querySelector(`.jp-shop-goal-btn[data-item-id="${itemId}"]`)
        let originalShopChips = currentChips
        if (goalBtnInGrid) {
          originalShopChips = parseFloat(goalBtnInGrid.dataset.itemPrice || goalBtnInGrid.dataset.price || currentChips)
        }
        const originalShopHours = originalShopChips / 50
        const originalShopDollars = originalShopHours * 6

        // Create modal
        const overlay = document.createElement("div")
        overlay.className = "jp-modal-overlay"
        overlay.innerHTML = `
          <div class="jp-modal">
            <div class="jp-modal-header">
              <h3 class="jp-modal-title">Edit: ${itemName}</h3>
              <button class="jp-modal-close" aria-label="Close">✕</button>
            </div>
            <div class="jp-modal-inputs">
              <div class="jp-modal-input-group">
                <label class="jp-modal-label">Hours</label>
                <input type="number" class="jp-modal-input" id="jp-edit-hours" value="${currentHours.toFixed(1)}" step="0.1" min="0" />
              </div>
              <div class="jp-modal-input-group">
                <label class="jp-modal-label">Dollars ($6/h)</label>
                <input type="number" class="jp-modal-input" id="jp-edit-dollars" value="${currentDollars.toFixed(2)}" step="0.01" min="0" />
              </div>
              <div class="jp-modal-input-group">
                <label class="jp-modal-label">Chips (50/h)</label>
                <input type="number" class="jp-modal-input" id="jp-edit-chips" value="${currentChips}" step="1" min="0" />
              </div>
            </div>
            <div class="jp-modal-actions">
              <button class="jp-modal-btn jp-modal-btn-reset" title="Reset to shop price">↺ Reset</button>
              <button class="jp-modal-btn jp-modal-btn-cancel">Cancel</button>
              <button class="jp-modal-btn jp-modal-btn-save">Save</button>
            </div>
          </div>
        `

        const hoursInput = overlay.querySelector("#jp-edit-hours")
        const dollarsInput = overlay.querySelector("#jp-edit-dollars")
        const chipsInput = overlay.querySelector("#jp-edit-chips")
        const closeBtn = overlay.querySelector(".jp-modal-close")
        const cancelBtn = overlay.querySelector(".jp-modal-btn-cancel")
        const saveBtn = overlay.querySelector(".jp-modal-btn-save")
        const resetBtn = overlay.querySelector(".jp-modal-btn-reset")

        // Linked inputs - update others when one changes
        hoursInput.addEventListener("input", () => {
          const h = parseFloat(hoursInput.value) || 0
          dollarsInput.value = (h * 6).toFixed(2)
          chipsInput.value = Math.round(h * 50)
        })

        dollarsInput.addEventListener("input", () => {
          const d = parseFloat(dollarsInput.value) || 0
          hoursInput.value = (d / 6).toFixed(1)
          chipsInput.value = Math.round((d / 6) * 50)
        })

        chipsInput.addEventListener("input", () => {
          const c = parseFloat(chipsInput.value) || 0
          hoursInput.value = (c / 50).toFixed(1)
          dollarsInput.value = ((c / 50) * 6).toFixed(2)
        })

        const closeModal = () => overlay.remove()
        closeBtn.addEventListener("click", closeModal)
        cancelBtn.addEventListener("click", closeModal)
        overlay.addEventListener("click", e => { if (e.target === overlay) closeModal() })

        // Reset to original shop price
        resetBtn.addEventListener("click", () => {
          hoursInput.value = originalShopHours.toFixed(1)
          dollarsInput.value = originalShopDollars.toFixed(2)
          chipsInput.value = originalShopChips
        })

        saveBtn.addEventListener("click", () => {
          const newChips = Math.round(parseFloat(chipsInput.value) || 0)
          goal.price = newChips
          goal.originalPrice = newChips
          goal.existingHours = 0
          saveGoals(goals)

          const goalBtn = container.querySelector(`.jp-shop-goal-btn[data-item-id="${itemId}"]`)
          if (goalBtn) goalBtn.dataset.price = newChips

          closeModal()
          renderGoalsSection(container)
        })

        document.body.appendChild(overlay)
        hoursInput.focus()
        hoursInput.select()
      })
    })
}

// Re-render goals section when toolbar stats change
window.addEventListener("jp:goals:changed", () => {
  const container = document.querySelector(".jp-shop-container")
  if (container) {
    console.log("Jackpot+: jp:goals:changed event received, re-rendering goals section")
    renderGoalsSection(container)
  }
})

// Re-render goals section when stats change
window.addEventListener("jp:stats:changed", () => {
  const container = document.querySelector(".jp-shop-container")
  if (container) {
    console.log("Jackpot+: jp:stats:changed event received, re-rendering goals section")
    renderGoalsSection(container)
  }
})

// Also listen for storage changes from other tabs
window.addEventListener("storage", e => {
  if (!e.key) return
  if (
    e.key === "jackpot_plus_goals" ||
    e.key === "jackpot_plus_deadline" ||
    e.key === "jackpot_plus_stats"
  ) {
    const container = document.querySelector(".jp-shop-container")
    if (container) {
      console.log("Jackpot+: storage change detected, re-rendering goals section")
      renderGoalsSection(container)
    }
  }
})
