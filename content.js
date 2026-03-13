// Content script for Jackpot+ — simplifies the deck view
console.log("Jackpot+: content script loaded.")

// Track current page type to detect navigation changes
let __jackpotCurrentPage = null

function getCurrentPageType() {
  if (document.body.classList.contains("shop-body")) return "shop"
  if (document.body.classList.contains("deck-body")) return "deck"
  return null
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
  `
  document.head.appendChild(style)

  console.log("Jackpot+: styles injected")
}

// Inject icons into shop buttons
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
      filterBar
        .querySelectorAll(".jp-shop-filter-btn")
        .forEach(b => b.classList.remove("jp-shop-filter-active"))

      const items = container.querySelectorAll(".jp-shop-item")
      if (wasActive) {
        // Was active, now deactivate — show all
        items.forEach(item => (item.style.display = ""))
      } else {
        // Activate this filter
        btn.classList.add("jp-shop-filter-active")
        items.forEach(item => {
          item.style.display = cat === "all" || item.dataset.category === cat ? "" : "none"
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

  // Restore hidden originals (they get hidden via CSS, but let's be safe)
  document.querySelectorAll(".deck-table, .shop-right > *:not(.jp-shop-container)").forEach(el => {
    el.style.display = ""
  })

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
const bodyClassObserver = new MutationObserver(mutations => {
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
const deckTableObserver = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) {
        // Element node
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
