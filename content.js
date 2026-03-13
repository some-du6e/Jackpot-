// Content script for Jackpot+ — simplifies the deck view
console.log("Jackpot+: content script loaded.")

// Track current page type to detect navigation changes
let __jackpotCurrentPage = null

function getCurrentPageType() {
  if (document.body.classList.contains("shop-body")) return "shop"
  if (document.body.classList.contains("deck-body")) return "deck"
  return null
}

// Persist stats to localStorage so they survive page navigations
const JP_STATS_KEY = "jackpot_plus_stats"

function loadStats() {
  try {
    const raw = localStorage.getItem(JP_STATS_KEY)
    return raw ? JSON.parse(raw) : { chips: "0.0", hours: "0.0" }
  } catch {
    return { chips: "0.0", hours: "0.0" }
  }
}

function saveStats(chips, hours) {
  try {
    localStorage.setItem(JP_STATS_KEY, JSON.stringify({ chips, hours }))
  } catch {}
}

// Enhance toolbar with chips and hours counters
function enhanceToolbar(retryCount = 0) {
  const toolbarRight = document.querySelector(".toolbar-right")
  const tokenCount = document.querySelector(".token-count")
  
  if (!toolbarRight) {
    if (retryCount < 10) {
      setTimeout(() => enhanceToolbar(retryCount + 1), 200)
    }
    return
  }
  
  // Check if already enhanced
  if (document.querySelector(".jp-toolbar-stats")) return
  
  // Load cached stats first (shows immediately even if DOM not ready)
  const cached = loadStats()
  
  // Try to get fresh values from DOM
  let chipsValue = cached.chips
  let totalHours = parseFloat(cached.hours)
  
  if (tokenCount) {
    chipsValue = tokenCount.textContent.trim()
  }
  
  const cards = document.querySelectorAll(".card-slot-filled")
  if (cards.length > 0) {
    totalHours = 0
    cards.forEach(card => {
      const hours = parseFloat(card.dataset.projectHours || "0")
      totalHours += hours
    })
  }
  
  const hoursStr = totalHours.toFixed(1)
  
  // Save fresh values
  saveStats(chipsValue, hoursStr)
  
  // Create the stats container
  const statsContainer = document.createElement("div")
  statsContainer.className = "jp-toolbar-stats"
  statsContainer.innerHTML = `
    <span class="jp-stat jp-chips-stat">
      <span class="jp-stat-emoji">🎰</span>
      <span class="jp-stat-value">${chipsValue}</span>
    </span>
    <span class="jp-stat jp-hours-stat">
      <span class="jp-stat-emoji">⏱️</span>
      <span class="jp-stat-value">${hoursStr}h</span>
    </span>
  `
  
  // Hide original token count and insert our stats
  if (tokenCount) tokenCount.style.display = "none"
  toolbarRight.insertBefore(statsContainer, toolbarRight.firstChild)
  
  console.log("Jackpot+: toolbar enhanced with stats", { chips: chipsValue, hours: hoursStr })
}

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
    
    /* Toolbar polish */
    .toolbar {
      backdrop-filter: blur(12px) saturate(1.2);
      -webkit-backdrop-filter: blur(12px) saturate(1.2);
      background: rgba(255, 255, 255, 0.85) !important;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      transition: box-shadow 0.3s ease;
    }
    
    .toolbar:hover {
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
    }
    
    .toolbar-content {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    /* Nav items polish */
    .nav-item {
      transition: 
        color 0.2s ease,
        transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      border-radius: 8px;
      padding: 6px 12px;
    }
    
    .nav-item:hover {
      transform: translateY(-1px);
    }
    
    .nav-active {
      position: relative;
    }
    
    .nav-active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 3px;
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
      border-radius: 2px;
      animation: jp-nav-indicator 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    
    @keyframes jp-nav-indicator {
      from { width: 0; opacity: 0; }
      to { width: 20px; opacity: 1; }
    }
    
    /* Avatar chip polish */
    .avatar-chip {
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .avatar-chip-btn:hover .avatar-chip {
      transform: scale(1.08);
    }
    
    .avatar-chip-btn:active .avatar-chip {
      transform: scale(0.95);
    }
    
    /* Toolbar stats styling */
    .jp-toolbar-stats {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-right: 12px;
      animation: jp-stats-slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    
    @keyframes jp-stats-slide-in {
      from {
        opacity: 0;
        transform: translateX(-12px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
    
    .jp-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      padding: 7px 14px;
      border-radius: 24px;
      cursor: default;
      transition: 
        transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.2s ease;
      user-select: none;
      position: relative;
      overflow: hidden;
    }
    
    .jp-stat::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      opacity: 0;
      transition: opacity 0.2s ease;
      background: radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 70%);
    }
    
    .jp-stat:hover {
      transform: translateY(-2px) scale(1.04);
    }
    
    .jp-stat:hover::before {
      opacity: 1;
    }
    
    .jp-stat:active {
      transform: translateY(0) scale(0.97);
      transition-duration: 0.1s;
    }
    
    .jp-stat-emoji {
      font-size: 15px;
      display: inline-block;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .jp-stat:hover .jp-stat-emoji {
      transform: scale(1.2) rotate(-8deg);
    }
    
    .jp-stat-value {
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.01em;
    }
    
    .jp-chips-stat {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
      color: #92400e;
      box-shadow: 
        0 1px 3px rgba(251, 191, 36, 0.3),
        0 0 0 1px rgba(251, 191, 36, 0.1) inset;
    }
    
    .jp-chips-stat:hover {
      box-shadow: 
        0 4px 12px rgba(251, 191, 36, 0.4),
        0 0 0 1px rgba(251, 191, 36, 0.2) inset;
    }
    
    .jp-hours-stat {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%);
      color: #1e40af;
      box-shadow: 
        0 1px 3px rgba(59, 130, 246, 0.2),
        0 0 0 1px rgba(59, 130, 246, 0.1) inset;
      animation-delay: 0.08s;
    }
    
    .jp-hours-stat:hover {
      box-shadow: 
        0 4px 12px rgba(59, 130, 246, 0.3),
        0 0 0 1px rgba(59, 130, 246, 0.2) inset;
    }
    
    /* Stagger the entrance */
    .jp-stat:nth-child(1) { animation: jp-stat-pop 0.4s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    .jp-stat:nth-child(2) { animation: jp-stat-pop 0.4s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    
    @keyframes jp-stat-pop {
      from {
        opacity: 0;
        transform: scale(0.8) translateY(4px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `
  document.head.appendChild(style)

  console.log("Jackpot+: styles injected")
}

// Inject icons into shop buttons
function injectShopIcons() {
  const iconMap = {
    "Add Prize": "add-prize.svg",
    "Shop Rules": "shop-rules.svg",
    "Buy": "buy.svg",
    "Generic": "generic.svg",
    "Setup": "setup.svg",
    "Hardware": "hardware.svg",
    "Las Vegas": "las-vegas.svg",
  }

  const buttons = document.querySelectorAll("button")
  buttons.forEach(btn => {
    const text = btn.textContent.trim()
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

// Transform the shop page into a single filtered grid
function transformShop(retryCount = 0) {
  // Only run on shop page
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

  // Check if already transformed
  if (document.querySelector(".jp-shop-container")) return

  // Collect all items from all category panels
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
      // Extract dollar amount from description like "By purchasing this, you will receive a $50 HCB grant."
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

  // Sort by price (low to high)
  allItems.sort((a, b) => a.price - b.price)

  // Build the new UI
  const container = document.createElement("div")
  container.className = "jp-shop-container"

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

    const img = document.createElement("img")
    img.src = chrome.runtime.getURL(`icons/${categoryIcons[cat]}`)
    img.className = "jp-icon"
    btn.appendChild(img)

    const span = document.createElement("span")
    span.textContent = categoryLabels[cat]
    btn.appendChild(span)

    btn.addEventListener("click", () => {
      // Toggle active state
      const wasActive = btn.classList.contains("jp-shop-filter-active")
      filterBar.querySelectorAll(".jp-shop-filter-btn").forEach(b => b.classList.remove("jp-shop-filter-active"))
      
      const items = container.querySelectorAll(".jp-shop-item")
      if (wasActive) {
        // Was active, now deactivate — show all
        items.forEach(item => item.style.display = "")
      } else {
        // Activate this filter
        btn.classList.add("jp-shop-filter-active")
        items.forEach(item => {
          item.style.display = (cat === "all" || item.dataset.category === cat) ? "" : "none"
        })
      }
    })

    filterBar.appendChild(btn)
  })

  container.appendChild(filterBar)

  // Sort controls
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

  // Items grid
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
      ? item.price.toLocaleString() + ' chips <span class="jp-shop-item-dollar">(' + item.dollarAmount + ' / ' + hoursAmount + 'h)</span>'
      : item.price.toLocaleString() + ' chips <span class="jp-shop-item-dollar">(' + hoursAmount + 'h)</span>'

    el.innerHTML = `
      <div class="jp-shop-item-card">
        ${item.image ? `<div class="jp-shop-item-image" style="background-image: url('${item.image}')"></div>` : ""}
        <div class="jp-shop-item-content">
          <span class="jp-shop-item-category jp-cat-${item.category}">${item.categoryLabel}</span>
          <h3 class="jp-shop-item-name">${item.name}</h3>
          <div class="jp-shop-item-footer">
            <span class="jp-shop-item-price">${priceHtml}</span>
            <button class="jp-shop-buy-btn" data-item-id="${item.id}">Buy</button>
          </div>
        </div>
      </div>
    `

    // Wire up buy button to trigger original modal
    el.querySelector(".jp-shop-buy-btn").addEventListener("click", () => {
      const originalBtn = document.querySelector(`.shop-buy-btn[data-item-id="${item.id}"]`)
      if (originalBtn) originalBtn.click()
    })

    grid.appendChild(el)
  })

  container.appendChild(grid)

  // Sort function
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
        // Value = chips per dollar (lower is better value)
        const valA = dollarA > 0 ? priceA / dollarA : Infinity
        const valB = dollarB > 0 ? priceB / dollarB : Infinity
        return (valA - valB) * dir
      } else {
        // Price
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

  // Insert our version (original elements hidden via CSS)
  shopRight.appendChild(container)

  console.log(`Jackpot+: shop transformed with ${allItems.length} items`)
}

// Cleanup from a previous version that wrote broad inline layout overrides.
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

  // Turbo/page scripts can re-apply inline styles after first paint.
  // Run a short cleanup burst, then stop to avoid persistent overhead.
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

// Transform the fancy card deck into a simple list
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

  // Get all filled cards
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

  // Create a simple list
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

    // Type icon mapping
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

  // Replace the deck table with the simple list
  deckTable.parentNode.replaceChild(listContainer, deckTable)

  // Save stats to localStorage so toolbar shows correct values on other pages
  const tokenCountEl = document.querySelector(".token-count")
  const chipsVal = tokenCountEl ? tokenCountEl.textContent.trim() : loadStats().chips
  const totalHrs = cards.reduce((sum, card) => sum + parseFloat(card.dataset.projectHours || "0"), 0)
  saveStats(chipsVal, totalHrs.toFixed(1))

  console.log("Jackpot+: deck transformed successfully")
}

// Start immediately and retry if needed
startInlineOverrideSanitizer()
injectStyles()
injectShopIcons()

function initPage() {
  // Remove any previous JP transformations so they can be re-applied
  document.querySelectorAll(".jp-shop-container").forEach(el => el.remove())
  document.querySelectorAll(".jackpot-simple-list").forEach(el => el.remove())
  document.querySelectorAll(".jp-toolbar-stats").forEach(el => el.remove())
  
  // Restore hidden originals (they get hidden via CSS, but let's be safe)
  document.querySelectorAll(".deck-table, .shop-right > *:not(.jp-shop-container)").forEach(el => {
    el.style.display = ""
  })
  
  // Restore original token count
  const tokenCount = document.querySelector(".token-count")
  if (tokenCount) tokenCount.style.display = ""

  if (document.body.classList.contains("shop-body")) {
    transformShop()
  } else if (document.body.classList.contains("deck-body")) {
    // The site's initDeck() has a deckInitialized flag that prevents re-running.
    // Content scripts can't access page JS directly, so inject a script tag.
    const resetScript = document.createElement("script")
    resetScript.textContent = `
      if (typeof deckInitialized !== "undefined") {
        deckInitialized = false;
      }
      if (typeof initDeck === "function") {
        console.log("Jackpot+: injected script calling initDeck()");
        initDeck();
      }
    `
    document.head.appendChild(resetScript)
    resetScript.remove()
    // Now transform after a delay to let initDeck() populate the DOM
    setTimeout(() => transformDeck(), 300)
  }
  injectShopIcons()
  enhanceToolbar()
}

// Run on initial load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPage)
} else {
  initPage()
}

// Re-run on SPA/Turbo navigation (tab changes)
document.addEventListener("turbo:load", () => {
  console.log("Jackpot+: turbo:load detected, re-initializing")
  setTimeout(initPage, 100)
})

document.addEventListener("turbo:render", () => {
  console.log("Jackpot+: turbo:render detected, re-initializing")
  setTimeout(initPage, 100)
})

// Also catch popstate (back/forward) and general navigation
window.addEventListener("popstate", () => {
  console.log("Jackpot+: popstate detected, re-initializing")
  setTimeout(initPage, 100)
})

// Watch for body class changes (page type switches)
const bodyClassObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.attributeName === "class") {
      const body = document.body
      const hasShopTransform = document.querySelector(".jp-shop-container")
      const hasDeckTransform = document.querySelector(".jackpot-simple-list")
      
      // If body class changed and our transform is missing or wrong, re-init
      if (body.classList.contains("shop-body") && !hasShopTransform) {
        console.log("Jackpot+: shop-body detected without transform, re-initializing")
        setTimeout(initPage, 100)
        break
      }
      if (body.classList.contains("deck-body") && !hasDeckTransform) {
        console.log("Jackpot+: deck-body detected without transform, re-initializing")
        setTimeout(initPage, 100)
        break
      }
    }
  }
})

bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] })

// Watch for deck-table appearing in DOM (faster than polling)
const deckTableObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) { // Element node
        if (node.classList?.contains("deck-table") || node.querySelector?.(".deck-table")) {
          console.log("Jackpot+: deck-table appeared in DOM, transforming")
          setTimeout(() => transformDeck(), 100)
          return
        }
        if (node.classList?.contains("shop-right") || node.querySelector?.(".shop-right")) {
          console.log("Jackpot+: shop-right appeared in DOM, transforming")
          setTimeout(() => transformShop(), 100)
          return
        }
      }
    }
  }
})

deckTableObserver.observe(document.body, { childList: true, subtree: true })
