// Jackpot+ — Toolbar stats (chips + hours)
console.log("Jackpot+: toolbar module loaded.")

const JP_STATS_KEY = "jackpot_plus_stats"

// Track previous values for tick animation
let prevChips = null
let prevHours = null

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

// Animate a number ticking from `from` to `to` over `duration` ms
function tickNumber(el, from, to, duration = 600, suffix = "") {
  const fromNum = parseFloat(from)
  const toNum = parseFloat(to)
  if (isNaN(fromNum) || isNaN(toNum) || fromNum === toNum) {
    el.textContent = to + suffix
    return
  }

  const startTime = performance.now()
  const diff = toNum - fromNum

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4)
  }

  function update(now) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeOutQuart(progress)
    const current = fromNum + diff * eased

    // Match the decimal places of the target
    const decimals = (to.split(".")[1] || "").length
    el.textContent = current.toFixed(decimals) + suffix

    if (progress < 1) {
      requestAnimationFrame(update)
    } else {
      el.textContent = to + suffix
    }
  }

  requestAnimationFrame(update)
}

// Flash a chip when its value updates
function flashChip(chip) {
  chip.classList.remove("jp-stat-updated")
  // Force reflow so the animation can retrigger
  void chip.offsetWidth
  chip.classList.add("jp-stat-updated")
  setTimeout(() => chip.classList.remove("jp-stat-updated"), 800)
}

function enhanceToolbar(retryCount = 0) {
  const toolbarRight = document.querySelector(".toolbar-right")
  const tokenCount = document.querySelector(".token-count")

  if (!toolbarRight) {
    if (retryCount < 10) {
      setTimeout(() => enhanceToolbar(retryCount + 1), 200)
    }
    return
  }

  const cached = loadStats()

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

  saveStats(chipsValue, hoursStr)

  // If stats already exist, just update values with tick animation
  const existing = document.querySelector(".jp-toolbar-stats")
  if (existing) {
    const chipsEl = existing.querySelector(".jp-chips-stat .jp-stat-value")
    const hoursEl = existing.querySelector(".jp-hours-stat .jp-stat-value")
    const chipsChip = existing.querySelector(".jp-chips-stat")
    const hoursChip = existing.querySelector(".jp-hours-stat")

    if (chipsEl && chipsValue !== prevChips) {
      tickNumber(chipsEl, prevChips || chipsValue, chipsValue, 500)
      flashChip(chipsChip)
    }
    if (hoursEl && hoursStr !== prevHours) {
      tickNumber(hoursEl, prevHours || hoursStr, hoursStr, 600, "h")
      flashChip(hoursChip)
    }

    prevChips = chipsValue
    prevHours = hoursStr
    return
  }

  // First render — create the stats container
  prevChips = chipsValue
  prevHours = hoursStr

  const statsContainer = document.createElement("div")
  statsContainer.className = "jp-toolbar-stats"
  statsContainer.innerHTML = `
    <span class="jp-stat jp-chips-stat">
      <span class="jp-stat-label">Chips</span>
      <span class="jp-stat-value">${chipsValue}</span>
    </span>
    <span class="jp-stat jp-hours-stat">
      <span class="jp-stat-label">Hours</span>
      <span class="jp-stat-value">${hoursStr}h</span>
    </span>
  `

  if (tokenCount) tokenCount.style.display = "none"
  toolbarRight.insertBefore(statsContainer, toolbarRight.firstChild)

  console.log("Jackpot+: toolbar enhanced with stats", { chips: chipsValue, hours: hoursStr })
}
