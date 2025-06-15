// --- CONFIGURATION ---

const SELECTORS = {
  // Headings
  h: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
  // Interactive Elements
  b: 'button, [role="button"]',
  l: 'a[href], [role="link"]',
  i: 'input:not([type="hidden"]), textarea, select, [contenteditable="true"]',
  c: 'input[type="checkbox"], [role="checkbox"]',
  t: 'input[type="radio"], [role="radio"]',
  // Landmark Roles
  n: 'nav, [role="navigation"]',
  m: 'main, [role="main"]',
  s: '[role="search"]',
  f: 'form[aria-label], form[aria-labelledby], [role="form"]',
  a: 'article, [role="article"]',
  // Grouping Roles
  T: 'table, [role="table"]',
  L: 'ul, ol, [role="list"]',
  d: '[role="dialog"], [role="alertdialog"]',
}

/**
 * CATEGORIES OF INTERACTION
 * This is the core of the new, safer logic.
 */

// 1. STAGED FOCUS: Highlight these elements first. User must press Enter to focus.
const STAGED_FOCUS_TYPES = ["i", "s"]

// 2. SCROLL & PING: For non-interactive content. Scroll to them and add a temporary highlight.
//    Focus is NOT changed.
const SCROLL_PING_TYPES = ["h", "n", "m", "f", "a", "T", "L", "d"]

// 3. DIRECT FOCUS: For all other types (buttons, links, etc.), focus them directly.

// --- STATE MANAGEMENT ---
let pendingKeystroke = null
let stagedElement = null // Renamed from highlightedElement for clarity
let pingTimeoutId = null // To manage the temporary highlight timeout

// --- CORE FUNCTIONS ---

function clearStagedState() {
  if (stagedElement) {
    stagedElement.classList.remove("jump-target-highlight")
    stagedElement = null
  }
}

/**
 * Applies a temporary "ping" highlight to an element.
 * @param {HTMLElement} element The element to highlight.
 */
function applyScrollPing(element) {
  // Clear any previous ping animation timeout
  if (pingTimeoutId) {
    clearTimeout(pingTimeoutId)
  }
  // The class is automatically removed by the CSS animation's `forwards` property,
  // but we'll also clean it up to be safe.
  element.classList.remove("jump-scroll-ping")

  // We need a slight delay to allow the browser to remove and re-add the class,
  // which ensures the animation restarts every time.
  setTimeout(() => {
    element.classList.add("jump-scroll-ping")
    pingTimeoutId = setTimeout(
      () => element.classList.remove("jump-scroll-ping"),
      1200
    ) // Animation duration
  }, 10)
}

function navigate(direction, typeKey) {
  const selector = SELECTORS[typeKey]
  if (!selector) return

  const allElements = Array.from(document.querySelectorAll(selector)).filter(
    el =>
      el.offsetParent !== null &&
      window.getComputedStyle(el).visibility !== "hidden"
  )

  if (allElements.length === 0) return

  // If focus is on the body, the reference point is the staged element, otherwise it's the active element.
  const currentActiveElement =
    document.activeElement === document.body
      ? stagedElement
      : document.activeElement

  let currentIndex = allElements.indexOf(currentActiveElement)

  if (currentIndex === -1) {
    const viewportCenterY = window.scrollY + window.innerHeight / 2
    let bestMatch = { index: -1, distance: Infinity }
    allElements.forEach((el, index) => {
      const distance = Math.abs(
        el.getBoundingClientRect().top + el.clientHeight / 2 - viewportCenterY
      )
      if (distance < bestMatch.distance) {
        bestMatch = { index, distance }
      }
    })
    currentIndex = bestMatch.index

    // Adjust index based on direction to ensure we don't land on the same element
    if (direction === "prev") {
      currentIndex++
    } else {
      currentIndex--
    }
  }

  const nextIndex =
    (currentIndex + (direction === "next" ? 1 : -1) + allElements.length) %
    allElements.length
  const newTarget = allElements[nextIndex]

  // --- NEW BEHAVIOR LOGIC ---
  clearStagedState() // Always clear previous staged state

  if (STAGED_FOCUS_TYPES.includes(typeKey)) {
    stagedElement = newTarget
    stagedElement.classList.add("jump-target-highlight")
    newTarget.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })
  } else if (SCROLL_PING_TYPES.includes(typeKey)) {
    applyScrollPing(newTarget)
    newTarget.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })
  } else {
    // DIRECT FOCUS
    newTarget.focus()
    newTarget.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })
  }
}

// --- EVENT LISTENERS ---
// --- EVENT LISTENERS ---

document.addEventListener("keydown", e => {
  const targetTag = e.target.tagName
  const isEditable =
    e.target.isContentEditable ||
    targetTag === "INPUT" ||
    targetTag === "TEXTAREA" ||
    targetTag === "SELECT"

  // Allow escape key press regardless of where focus is
  if (e.key === "Escape") {
    clearStagedState()
    pendingKeystroke = null
    return
  }

  // Handle Enter key for staged elements
  if (e.key === "Enter" && stagedElement) {
    e.preventDefault()
    const elementToFocus = stagedElement
    clearStagedState()
    elementToFocus.focus()
    return
  }

  // Don't process other key combinations when in editable fields
  // unless we're dealing with a staged element
  if (isEditable && e.target !== stagedElement) {
    return
  }

  // First key in the sequence
  if (e.key === "[" || e.key === "]") {
    pendingKeystroke = { direction: e.key === "]" ? "next" : "prev" }
    e.preventDefault()
    return
  }

  // Second key in the sequence (only process if we have a pending keystroke)
  if (pendingKeystroke && SELECTORS[e.key]) {
    e.preventDefault()
    navigate(pendingKeystroke.direction, e.key)
    pendingKeystroke = null
  }
})
