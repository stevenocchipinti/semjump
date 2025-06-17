// --- CONFIGURATION ---

const SELECTORS = {
  // Headings
  h: 'h1, h2, h3, h4, h5, h6, [role="heading"]',
  // Paragraphs
  p: 'p, [role="paragraph"]',
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
const SCROLL_PING_TYPES = ["h", "p", "n", "m", "f", "a", "T", "L", "d"]

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

  // Clean up any existing pings
  document.querySelectorAll(".jump-scroll-ping").forEach(el => {
    el.classList.remove("jump-scroll-ping")
  })

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

  // Find the viewport boundaries
  const viewportTop = window.scrollY
  const viewportBottom = viewportTop + window.innerHeight
  const viewportMiddle = viewportTop + window.innerHeight / 2

  // Special handling for directly focusable elements like buttons
  if (
    !SCROLL_PING_TYPES.includes(typeKey) &&
    !STAGED_FOCUS_TYPES.includes(typeKey)
  ) {
    // Get currently focused element
    const currentFocusedEl = document.activeElement

    // Check if current element is one of our targets
    let currentIndex = allElements.indexOf(currentFocusedEl)

    // If we have a focused element of the correct type
    if (currentIndex !== -1) {
      // Move to next/prev without wrapping
      let nextIndex = currentIndex + (direction === "next" ? 1 : -1)

      // If we're at the end or beginning, stop there
      if (nextIndex < 0) {
        nextIndex = 0
      } else if (nextIndex >= allElements.length) {
        nextIndex = allElements.length - 1
      }

      // If we're already at the edge, don't move
      if (nextIndex === currentIndex) {
        return
      }

      const newTarget = allElements[nextIndex]

      console.log("Directly focusing on:", newTarget)
      newTarget.focus()
      newTarget.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      })
      return
    }
  }

  // We need to track the currently highlighted element for SCROLL_PING_TYPES
  let currentElement = null

  // For scroll ping types, try to see if we already have a pinged element in view
  if (SCROLL_PING_TYPES.includes(typeKey)) {
    const scrolledElements = allElements.filter(el => {
      return el.classList.contains("jump-scroll-ping")
    })

    if (scrolledElements.length > 0) {
      currentElement = scrolledElements[0]
    }
  }

  // Get current index if we have an element
  let currentIndex = -1
  if (currentElement) {
    currentIndex = allElements.indexOf(currentElement)
  }

  // Default target index calculation
  let targetIndex

  if (direction === "next") {
    // If we have a current element, try to go to the next one
    if (currentIndex !== -1) {
      targetIndex = currentIndex + 1
      // Don't wrap around, stay at the last element
      if (targetIndex >= allElements.length) {
        targetIndex = allElements.length - 1

        // If we're already at the last element, don't move
        if (targetIndex === currentIndex) {
          return
        }
      }
    } else {
      // Otherwise, find the first element below the middle of the viewport
      let candidateIndex = -1
      for (let i = 0; i < allElements.length; i++) {
        const rect = allElements[i].getBoundingClientRect()
        const elementTop = rect.top + window.scrollY

        if (elementTop > viewportMiddle) {
          candidateIndex = i
          break
        }
      }

      // If we found a candidate below the viewport middle, use it
      // Otherwise use the first element but don't wrap
      targetIndex = candidateIndex !== -1 ? candidateIndex : 0
    }
  } else {
    // If we have a current element, try to go to the previous one
    if (currentIndex !== -1) {
      targetIndex = currentIndex - 1
      // Don't wrap around, stay at the first element
      if (targetIndex < 0) {
        targetIndex = 0

        // If we're already at the first element, don't move
        if (targetIndex === currentIndex) {
          return
        }
      }
    } else {
      // For "prev", find the last element above the middle of the viewport
      let candidateIndex = -1
      for (let i = allElements.length - 1; i >= 0; i--) {
        const rect = allElements[i].getBoundingClientRect()
        const elementBottom = rect.bottom + window.scrollY

        if (elementBottom < viewportMiddle) {
          candidateIndex = i
          break
        }
      }

      // If we found a candidate above the viewport middle, use it
      // Otherwise use the last element but don't wrap
      targetIndex =
        candidateIndex !== -1 ? candidateIndex : allElements.length - 1
    }
  }

  // Get the target element
  const newTarget = allElements[targetIndex]

  clearStagedState() // Always clear previous staged state

  if (STAGED_FOCUS_TYPES.includes(typeKey)) {
    console.log("Staging focus on:", newTarget)
    stagedElement = newTarget
    stagedElement.classList.add("jump-target-highlight")
    newTarget.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })
  } else if (SCROLL_PING_TYPES.includes(typeKey)) {
    console.log("Applying scroll ping to:", newTarget)
    applyScrollPing(newTarget)
    newTarget.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    })
  } else {
    console.log("Directly focusing on:", newTarget)
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
