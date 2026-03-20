// Jackpot+ — Goals module
console.log("Jackpot+: goals module loaded.")

const JP_GOALS_KEY = "jackpot_plus_goals"
const JP_DEADLINE_KEY = "jackpot_plus_deadline"

// Load goals from localStorage
// Returns: { [itemId]: { price, breakDays, setAt } }
function loadGoals() {
  try {
    const raw = localStorage.getItem(JP_GOALS_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    console.log("Jackpot+: loadGoals ->", Object.keys(parsed).length, "goals")
    return parsed
  } catch {
    return {}
  }
}

// Save goals to localStorage
function saveGoals(goals) {
  try {
    localStorage.setItem(JP_GOALS_KEY, JSON.stringify(goals))
    // Notify other parts of the UI in this tab that goals changed
    try {
      window.dispatchEvent(new CustomEvent("jp:goals:changed"))
    } catch (e) {}
  } catch {}
}

// Get the deadline date
function getDeadline() {
  try {
    const raw = localStorage.getItem(JP_DEADLINE_KEY)
    return raw ? new Date(raw) : null
  } catch {
    return null
  }
}

// Get days remaining until deadline (from today)
function getDaysRemaining() {
  let deadline = getDeadline()
  if (!deadline) {
    // Default deadline: May 8, 2026
    deadline = new Date("2026-05-08")
  }
  if (!deadline) return 30 // fallback

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = deadline.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return Math.max(days, 0)
}

// Save the deadline date
function saveDeadline(date) {
  try {
    localStorage.setItem(JP_DEADLINE_KEY, date.toISOString())
    // Deadline affects daily target calculations — notify listeners
    try {
      window.dispatchEvent(new CustomEvent("jp:goals:changed"))
    } catch (e) {}
  } catch {}
}

// Add or update a goal for an item
// If existingHours is provided, subtract that much work (in hours) from the price
function setGoal(itemId, price, breakDays = 0, existingHours = 0) {
  const goals = loadGoals()

  // Convert existing hours to chips (50 chips = 1 hour) and subtract from price
  const chipsToSubtract = existingHours * 50
  const remainingPrice = Math.max(0, price - chipsToSubtract)

  goals[itemId] = {
    price: remainingPrice,
    breakDays: breakDays,
    setAt: new Date().toISOString(),
    originalPrice: price, // Keep track of original price for display
    existingHours: existingHours, // Track how much was already done
  }
  saveGoals(goals)
  console.log("Jackpot+: setGoal saved", itemId, goals[itemId])
}

// Remove a goal
function removeGoal(itemId) {
  const goals = loadGoals()
  delete goals[itemId]
  saveGoals(goals)
}

// Check if an item has a goal
function hasGoal(itemId) {
  const goals = loadGoals()
  return itemId in goals
}

// Calculate chips per day for a goal
function getChipsPerDay(goal, totalDays) {
  const workingDays = Math.max(totalDays - (goal.breakDays || 0), 1)
  return Math.ceil(goal.price / workingDays)
}

// Calculate hours per day for a goal (50 chips = 1 hour)
function getHoursPerDay(goal, totalDays) {
  const chipsPerDay = getChipsPerDay(goal, totalDays)
  return (chipsPerDay / 50).toFixed(1)
}
