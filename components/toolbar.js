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

    // Still update goal pill
    renderToolbarGoalPill(toolbarRight)
    renderHackTimeStat(toolbarRight)
    return
  }

  // First render — create the stats container
  prevChips = chipsValue
  prevHours = hoursStr

  const statsContainer = document.createElement("div")
  statsContainer.className = "jp-toolbar-stats"
  statsContainer.innerHTML = `
    <span class="jp-stat jp-chips-stat">
      <span class="jp-stat-icon">🪙</span>
      <span class="jp-stat-value">${chipsValue}</span>
    </span>
    <span class="jp-stat jp-hours-stat">
      <span class="jp-stat-icon">⏱</span>
      <span class="jp-stat-value">${hoursStr}h</span>
    </span>
  `

  if (tokenCount) tokenCount.style.display = "none"
  toolbarRight.insertBefore(statsContainer, toolbarRight.firstChild)

  // Render goal pill in toolbar
  renderToolbarGoalPill(toolbarRight)
  renderHackTimeStat(toolbarRight)

  console.log("Jackpot+: toolbar enhanced with stats", { chips: chipsValue, hours: hoursStr })
}

function renderHackTimeStat(toolbarRight) {
  // Combine today's hackatime hours with the goal pill (show: Xh done / Yh target)
  try {
    chrome.storage.sync.get(["hackatime_api_key"], async result => {
      const key = result.hackatime_api_key

      // Compute target hours per day from goals
      let targetHours = 0
      try {
        if (typeof loadGoals === "function" && typeof getDaysRemaining === "function") {
          const goals = loadGoals()
          const goalIds = Object.keys(goals)
          const totalDays = getDaysRemaining()
          goalIds.forEach(itemId => {
            const goal = goals[itemId]
            if (!goal || !goal.price) return
            const workingDays = Math.max(totalDays - (goal.breakDays || 0), 1)
            const chipsPerDay = Math.ceil(goal.price / workingDays)
            targetHours += chipsPerDay / 50
          })
        }
      } catch (err) {
        console.warn("Jackpot+: failed to compute target hours", err)
      }

      // If no goals and no key, nothing to show
      if (!targetHours && !key) return

      // Default displayed values
      let todayHours = null

      if (key) {
        try {
          const res = await fetch("https://hackatime.hackclub.com/api/hackatime/v1/users/current/statusbar/today", {
            headers: { Authorization: `Bearer ${key}` },
            cache: "no-cache",
            credentials: "omit",
          })

          if (res.ok) {
            const data = await res.json()
            const seconds = (data && data.data && data.data.grand_total && data.data.grand_total.total_seconds) || 0
            todayHours = (seconds / 3600)
          } else {
            console.warn("Jackpot+: Hackatime fetch failed", res.status)
          }
        } catch (e) {
          console.warn("Jackpot+: Error fetching Hackatime data", e)
        }
      }

      // Build pill content
      const goalPill = document.querySelector(".jp-toolbar-goal-pill") || (function() {
        const p = document.createElement("a")
        p.href = "/shop"
        p.className = "jp-toolbar-goal-pill"
        return p
      })()

      const th = targetHours.toFixed(1)
      const dh = todayHours != null ? todayHours.toFixed(1) : "-"
      goalPill.innerHTML = `<span class="jp-goal-pill-icon">🎯</span><span class="jp-goal-pill-text">${dh}h / ${th}h</span>`
      goalPill.title = `${dh}h done today — target ${th}h/day — click to view shop`

      // Insert at toolbar start
      const toolbar = toolbarRight
      const first = toolbar.firstChild
      if (!document.querySelector(".jp-toolbar-goal-pill")) {
        if (first) toolbar.insertBefore(goalPill, first)
        else toolbar.appendChild(goalPill)
      }
    })
  } catch (e) {
    console.warn("Jackpot+: failed to read hackatime_api_key from storage", e)
  }
}

function renderToolbarGoalPill(toolbarRight) {
  // Remove existing goal pill
  const existing = document.querySelector(".jp-toolbar-goal-pill")
  if (existing) existing.remove()

  // Check if we have goals (functions from shop.js)
  if (typeof loadGoals !== "function" || typeof getDaysRemaining !== "function") return

  const goals = loadGoals()
  const goalIds = Object.keys(goals)
  if (goalIds.length === 0) return

  const totalDays = getDaysRemaining()
  if (totalDays <= 0) return

  // Calculate total hours per day across all goals
  let totalHoursPerDay = 0
  goalIds.forEach(itemId => {
    const goal = goals[itemId]
    const workingDays = Math.max(totalDays - goal.breakDays, 1)
    // We don't have item prices here, so we store them in the goal
    if (goal.price) {
      const chipsPerDay = Math.ceil(goal.price / workingDays)
      totalHoursPerDay += chipsPerDay / 50
    }
  })

  const pill = document.createElement("a")
  pill.href = "/shop"
  pill.className = "jp-toolbar-goal-pill"
  pill.title = `${goalIds.length} goal${goalIds.length > 1 ? "s" : ""} set — click to view shop`

  if (goalIds.length === 1 && goals[goalIds[0]].price) {
    const goal = goals[goalIds[0]]
    const workingDays = Math.max(totalDays - goal.breakDays, 1)
    const chipsPerDay = Math.ceil(goal.price / workingDays)
    const hoursPerDay = (chipsPerDay / 50).toFixed(1)
    pill.innerHTML = `<span class="jp-goal-pill-icon">🎯</span><span class="jp-goal-pill-text">${hoursPerDay}h/day</span>`
  } else {
    pill.innerHTML = `<span class="jp-goal-pill-icon">🎯</span><span class="jp-goal-pill-text">${goalIds.length} goals</span>`
  }

  toolbarRight.insertBefore(pill, toolbarRight.firstChild)
}

// Initialize toolbar enhancement
document.addEventListener("turbo:load", () => enhanceToolbar())
if (document.readyState !== "loading") enhanceToolbar()
