// Jackpot+ — Shop transformation and icon injection
console.log("Jackpot+: shop module loaded.")

const JP_GOALS_KEY = "jackpot_plus_goals"
const JP_EVENT_END = new Date("2026-05-08T23:59:59")

function loadGoals() {
  try {
    const raw = localStorage.getItem(JP_GOALS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveGoals(goals) {
  try {
    localStorage.setItem(JP_GOALS_KEY, JSON.stringify(goals))
  } catch {}
}

function getDaysRemaining() {
  const now = new Date()
  const diff = JP_EVENT_END - now
  if (diff <= 0) return 0
  return Math.ceil(diff / 86400000)
}

function createGoalModal(item, existingGoal, onSave, onRemove) {
  const totalDays = getDaysRemaining()
  const isEventOver = totalDays <= 0

  const modal = document.createElement("div")
  modal.className = "modal-overlay jp-goal-modal"
  modal.setAttribute("aria-hidden", "true")

  const savedBreakDays = existingGoal ? existingGoal.breakDays : 0
  const workingDays = Math.max(totalDays - savedBreakDays, 1)
  const chipsPerDay = Math.ceil(item.price / workingDays)
  const hoursPerDay = (chipsPerDay / 50).toFixed(1)

  modal.innerHTML = `
    <div class="modal-content jp-goal-modal-content" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-title">🎯 Set Goal</h3>
        <button type="button" class="modal-close jp-goal-close" aria-label="Close">×</button>
      </div>
      <div class="jp-goal-body">
        <div class="jp-goal-item-info">
          <div class="jp-goal-item-name">${item.name}</div>
          <div class="jp-goal-item-price">${item.price.toLocaleString()} chips${item.dollarAmount ? ` (${item.dollarAmount})` : ""}</div>
        </div>

        <div class="jp-goal-stats-grid">
          <div class="jp-goal-stat">
            <span class="jp-goal-stat-label">Event ends</span>
            <span class="jp-goal-stat-value">May 8, 2026</span>
          </div>
          <div class="jp-goal-stat">
            <span class="jp-goal-stat-label">Days left</span>
            <span class="jp-goal-stat-value">${isEventOver ? "Ended" : totalDays}</span>
          </div>
        </div>

        ${
          isEventOver
            ? `<div class="jp-goal-ended">The event has ended. Goals are no longer available.</div>`
            : `
        <div class="project-form-field">
          <label for="jpGoalBreakDays">Break days (days you won't work)</label>
          <input type="number" id="jpGoalBreakDays" class="jp-goal-input" min="0" max="${totalDays - 1}" value="${savedBreakDays}" />
          <p class="jp-settings-hint">Weekends, holidays, rest days — anything where you won't log hours</p>
        </div>

        <div class="jp-goal-calculation">
          <div class="jp-goal-calc-row">
            <span class="jp-goal-calc-label">Working days</span>
            <span class="jp-goal-calc-value" id="jpGoalWorkingDays">${workingDays}</span>
          </div>
          <div class="jp-goal-calc-row">
            <span class="jp-goal-calc-label">Chips per day</span>
            <span class="jp-goal-calc-value" id="jpGoalChipsPerDay">${chipsPerDay.toLocaleString()}</span>
          </div>
          <div class="jp-goal-calc-row jp-goal-calc-highlight">
            <span class="jp-goal-calc-label">⚡ Hours per day</span>
            <span class="jp-goal-calc-value" id="jpGoalHoursPerDay">${hoursPerDay}h</span>
          </div>
        </div>
        `
        }
      </div>
      <div class="project-form-actions">
        ${existingGoal ? `<button type="button" class="project-delete-btn jp-goal-remove">Remove Goal</button>` : `<div></div>`}
        <div style="display:flex;gap:8px;">
          <button type="button" class="project-cancel-btn jp-goal-cancel">Cancel</button>
          ${isEventOver ? "" : `<button type="button" class="project-save-btn jp-goal-save">Save Goal</button>`}
        </div>
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Animate in
  requestAnimationFrame(() => {
    modal.classList.add("active")
    modal.setAttribute("aria-hidden", "false")
  })

  function close() {
    modal.classList.remove("active")
    modal.setAttribute("aria-hidden", "true")
    setTimeout(() => modal.remove(), 300)
  }

  // Event listeners
  modal.querySelector(".jp-goal-close").addEventListener("click", close)
  modal.querySelector(".jp-goal-cancel").addEventListener("click", close)
  modal.addEventListener("click", e => {
    if (e.target === modal) close()
  })

  const escHandler = e => {
    if (e.key === "Escape") {
      close()
      document.removeEventListener("keydown", escHandler)
    }
  }
  document.addEventListener("keydown", escHandler)

  if (!isEventOver) {
    const breakDaysInput = modal.querySelector("#jpGoalBreakDays")
    breakDaysInput.addEventListener("input", () => {
      let breakDays = parseInt(breakDaysInput.value) || 0
      breakDays = Math.max(0, Math.min(breakDays, totalDays - 1))
      const wd = Math.max(totalDays - breakDays, 1)
      const cpd = Math.ceil(item.price / wd)
      const hpd = (cpd / 50).toFixed(1)
      modal.querySelector("#jpGoalWorkingDays").textContent = wd
      modal.querySelector("#jpGoalChipsPerDay").textContent = cpd.toLocaleString()
      modal.querySelector("#jpGoalHoursPerDay").textContent = hpd + "h"
    })

    modal.querySelector(".jp-goal-save").addEventListener("click", () => {
      const breakDays = Math.max(0, Math.min(parseInt(breakDaysInput.value) || 0, totalDays - 1))
      onSave(breakDays)
      close()
    })
  }

  const removeBtn = modal.querySelector(".jp-goal-remove")
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      onRemove()
      close()
    })
  }
}

function renderGoalBanner(container, allItems) {
  const existing = container.querySelector(".jp-shop-goal-banner")
  if (existing) existing.remove()

  const goals = loadGoals()
  const goalIds = Object.keys(goals)
  if (goalIds.length === 0) return

  const totalDays = getDaysRemaining()
  if (totalDays <= 0) return

  const banner = document.createElement("div")
  banner.className = "jp-shop-goal-banner"

  let bannerHtml = `<div class="jp-goal-banner-header">
    <span class="jp-goal-banner-icon">🎯</span>
    <span class="jp-goal-banner-title">Your Goals</span>
  </div>
  <div class="jp-goal-banner-items">`

  goalIds.forEach(itemId => {
    const item = allItems.find(i => i.id === itemId)
    if (!item) return
    const goal = goals[itemId]
    const workingDays = Math.max(totalDays - goal.breakDays, 1)
    const chipsPerDay = Math.ceil(item.price / workingDays)
    const hoursPerDay = (chipsPerDay / 50).toFixed(1)

    bannerHtml += `
      <div class="jp-goal-banner-item">
        <span class="jp-goal-banner-item-name">${item.name}</span>
        <span class="jp-goal-banner-item-target">${hoursPerDay}h/day · ${workingDays} working days</span>
      </div>
    `
  })

  bannerHtml += `</div>`
  banner.innerHTML = bannerHtml

  // Insert at the very top of the container
  container.prepend(banner)
}

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
        items.forEach(item => {
          item.style.display = cat === "all" || item.dataset.category === cat ? "" : "none"
        })
      }
    })

    filterBar.appendChild(btn)
  })

  container.appendChild(filterBar)

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

  const grid = document.createElement("div")
  grid.className = "jp-shop-grid"

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

    const goals = loadGoals()
    const isGoal = !!goals[item.id]
    const totalDays = getDaysRemaining()
    let goalBadgeHtml = ""
    if (isGoal && totalDays > 0) {
      const goal = goals[item.id]
      const workingDays = Math.max(totalDays - goal.breakDays, 1)
      const chipsPerDay = Math.ceil(item.price / workingDays)
      const hoursPerDay = (chipsPerDay / 50).toFixed(1)
      goalBadgeHtml = `<span class="jp-item-goal-badge">🎯 ${hoursPerDay}h/day</span>`
    }

    el.innerHTML = `
      <div class="jp-shop-item-card">
        ${item.image ? `<div class="jp-shop-item-image" style="background-image: url('${item.image}')"></div>` : ""}
        <div class="jp-shop-item-content">
          <span class="jp-shop-item-category jp-cat-${item.category}">${item.categoryLabel}</span>
          <h3 class="jp-shop-item-name">${item.name}</h3>
          ${goalBadgeHtml}
          <div class="jp-shop-item-footer">
            <span class="jp-shop-item-price">${priceHtml}</span>
            <div class="jp-shop-item-actions">
              <button class="jp-shop-star-btn ${isGoal ? "starred" : ""}" data-item-id="${item.id}" title="${isGoal ? "Edit goal" : "Set as goal"}">⭐</button>
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

    el.querySelector(".jp-shop-star-btn").addEventListener("click", () => {
      const currentGoals = loadGoals()
      const existingGoal = currentGoals[item.id] || null
      createGoalModal(
        item,
        existingGoal,
        breakDays => {
          const updatedGoals = loadGoals()
          updatedGoals[item.id] = { breakDays, price: item.price, name: item.name, savedAt: new Date().toISOString() }
          saveGoals(updatedGoals)
          // Re-render the shop to reflect changes
          const existingContainer = document.querySelector(".jp-shop-container")
          if (existingContainer) existingContainer.remove()
          transformShop()
        },
        () => {
          const updatedGoals = loadGoals()
          delete updatedGoals[item.id]
          saveGoals(updatedGoals)
          const existingContainer = document.querySelector(".jp-shop-container")
          if (existingContainer) existingContainer.remove()
          transformShop()
        }
      )
    })

    grid.appendChild(el)
  })

  container.appendChild(grid)

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

  // Render goal banner if goals exist
  renderGoalBanner(container, allItems)

  console.log(`Jackpot+: shop transformed with ${allItems.length} items`)
}
