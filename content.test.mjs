/**
 * @jest-environment jsdom
 */

// Import jest-dom before other imports to ensure it's available early in the setup
import "@testing-library/jest-dom"
import { screen, getByRole } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import { fileURLToPath } from "url"
import { jest, describe, test, expect } from "@jest/globals"
import fs from "fs"
import path, { dirname } from "path"

// --- Test Setup ---
const setupTestEnvironment = html => {
  document.body.innerHTML = html

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const contentScriptPath = path.resolve(__dirname, "./content.mjs")

  const contentScriptCode = fs.readFileSync(contentScriptPath, "utf8")
  new Function(contentScriptCode)()
  return { user: userEvent.setup({ delay: null }) } // Use delay: null for faster tests
}

// Use fake timers to control CSS animation timeouts
jest.useFakeTimers()

describe("Semantic Jump Extension", () => {
  test('DIRECT FOCUS: should focus the next button when user presses "]b"', async () => {
    const { user } = setupTestEnvironment(`
      <button>Button 1</button>
      <button>Button 2</button>
    `)
    await user.click(screen.getByRole("button", { name: /Button 1/i }))

    await user.keyboard("]b")

    expect(screen.getByRole("button", { name: /Button 2/i })).toHaveFocus()
  })

  test('STAGED FOCUS: should highlight the next input when user presses "]i"', async () => {
    const { user } = setupTestEnvironment(`
      <button>Start</button>
      <input aria-label="First Name" type="text" />
    `)
    const startButton = screen.getByRole("button", { name: /Start/i })
    const input = screen.getByRole("textbox", { name: /First Name/i })

    await user.click(startButton)
    await user.keyboard("]i")

    expect(startButton).toHaveFocus()
    expect(input).toHaveClass("jump-target-highlight")
  })

  test('STAGED FOCUS: should focus a staged input when user presses "Enter"', async () => {
    const { user } = setupTestEnvironment(`<input aria-label="Email" />`)
    const input = screen.getByRole("textbox", { name: /Email/i })

    document.body.focus()
    await user.keyboard("]i") // Stage the input

    await user.keyboard("{Enter}")

    expect(input).toHaveFocus()
    expect(input).not.toHaveClass("jump-target-highlight")
  })

  test('SCROLL & PING: should apply a temporary "ping" to the next heading', async () => {
    const { user } = setupTestEnvironment(`
      <button>Start</button>
      <h1>Heading 1</h1>
    `)
    const startButton = screen.getByRole("button")
    const heading = screen.getByRole("heading", { name: /Heading 1/i })

    await user.click(startButton)
    await user.keyboard("]h")

    // The "ping" class is added and then removed by a timer.
    // We need to advance the timers to test this.
    jest.advanceTimersByTime(50) // Advance time just enough for the class to be added

    // Assert: Focus remains on the button
    expect(startButton).toHaveFocus()
    // Assert: The heading gets the temporary highlight class
    expect(heading).toHaveClass("jump-scroll-ping")

    // Now, advance time past the animation duration
    jest.advanceTimersByTime(1200)

    // Assert: The class has been removed
    expect(heading).not.toHaveClass("jump-scroll-ping")
  })

  test("SCROLL & PING: should navigate between two non-focusable elements", async () => {
    const { user } = setupTestEnvironment(`
      <h1 id="h1">Heading 1</h1>
      <h2 id="h2">Heading 2</h2>
    `)

    // Since nothing is focused, the script should find the nearest element to start.
    // Let's assume it finds h1.
    document.body.focus()
    await user.keyboard("]h")
    jest.advanceTimersByTime(50)

    // Assert that we've now pinged the first heading
    expect(document.getElementById("h1")).toHaveClass("jump-scroll-ping")

    // Act again to go to the next one
    await user.keyboard("]h")
    jest.advanceTimersByTime(50)

    // Assert that the new target is pinged
    expect(document.getElementById("h2")).toHaveClass("jump-scroll-ping")
    // Assert that the old target is no longer pinged
    expect(document.getElementById("h1")).not.toHaveClass("jump-scroll-ping")
  })
})
