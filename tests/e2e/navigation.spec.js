// @ts-check
const { test, expect } = require("@playwright/test")

test.describe("Semantic Jump Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Load the test page and inject the content script
    await page.goto("http://localhost:3000/index.html")
    await page.addScriptTag({ path: "./content.mjs", type: "module" })
  })

  test("should navigate between headings with ]h", async ({ page }) => {
    // First we should see the page heading
    const h1 = page.locator("h1")
    await expect(h1).toBeVisible()

    // Press ]h to move to the first h2
    await page.keyboard.press("]")
    await page.keyboard.press("h")

    // Wait for the first h2 to be highlighted
    // Wait for the first h2 to be highlighted
    const firstH2 = page.locator("h2").first()

    // Check if the expected element has the class
    try {
      await expect(
        firstH2,
        "Expected first h2 to have class jump-scroll-ping"
      ).toHaveClass(/jump-scroll-ping/, {
        timeout: 3000,
      })
    } catch (error) {
      // Find which element actually has the class
      // Find which element actually has the class
      const actualElementWithClass = page.locator(
        ".jump-scroll-ping, [class*='jump-scroll-ping-']"
      )
      const count = await actualElementWithClass.count()
      if (count > 0) {
        const elementDetails = await actualElementWithClass.evaluateAll(els =>
          els.map(el => ({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            text: el.textContent?.substring(0, 50),
            selector:
              el.tagName.toLowerCase() +
              (el.id ? `#${el.id}` : "") +
              (el.className ? `.${el.className.replace(/\s+/g, ".")}` : ""),
          }))
        )
        console.log(`Expected element to have class: ${firstH2}`)
        console.log(
          `Found ${count} elements with ping class instead:`,
          JSON.stringify(elementDetails, null, 2)
        )
      }
      throw error
    }

    // Check if any other element has the class when it shouldn't
    const wrongElementsWithClass = page.locator(
      `:not(h2:nth-of-type(1)).jump-scroll-ping, :not(h2:nth-of-type(1))[class*='jump-scroll-ping-']`
    )
    const wrongElementCount = await wrongElementsWithClass.count()
    expect(
      wrongElementCount,
      `Found ${wrongElementCount} other elements with the ping class`
    ).toBe(0)

    // Press ]h again to move to the second h2
    await page.keyboard.press("]")
    await page.keyboard.press("h")

    // Verify we moved to the second h2
    const secondH2 = page.locator("h2").nth(1)
    try {
      await expect(
        secondH2,
        "Expected second h2 to have class jump-scroll-ping"
      ).toHaveClass(/jump-scroll-ping/, {
        timeout: 3000,
      })
    } catch (error) {
      // Find which element actually has the class
      const actualElementWithClass = page.locator(
        ".jump-scroll-ping, [class*='jump-scroll-ping-']"
      )
      const count = await actualElementWithClass.count()
      if (count > 0) {
        const elementDetails = await actualElementWithClass.evaluateAll(els =>
          els.map(el => ({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            text: el.textContent?.substring(0, 50),
            selector:
              el.tagName.toLowerCase() +
              (el.id ? `#${el.id}` : "") +
              (el.className ? `.${el.className.replace(/\s+/g, ".")}` : ""),
          }))
        )
        console.log(`Expected element to have class: ${secondH2}`)
        console.log(
          `Found ${count} elements with ping class instead:`,
          JSON.stringify(elementDetails, null, 2)
        )
      }
      throw error
    }

    // Check if any other element has the class when it shouldn't
    const wrongElementsWithClass2 = page.locator(
      `:not(h2:nth-of-type(2)).jump-scroll-ping, :not(h2:nth-of-type(2))[class*='jump-scroll-ping-']`
    )
    const wrongElementCount2 = await wrongElementsWithClass2.count()
    expect(
      wrongElementCount2,
      `Found ${wrongElementCount2} other elements with the ping class`
    ).toBe(0)

    // Press ]h again to move to the third h2
    await page.keyboard.press("]")
    await page.keyboard.press("h")

    // Verify we moved to the third h2
    const thirdH2 = page.locator("h2").nth(2)
    try {
      await expect(
        thirdH2,
        "Expected third h2 to have class jump-scroll-ping"
      ).toHaveClass(/jump-scroll-ping/, {
        timeout: 3000,
      })
    } catch (error) {
      // Find which element actually has the class
      const actualElementWithClass = page.locator(
        ".jump-scroll-ping, .jump-scroll-ping-*"
      )
      const count = await actualElementWithClass.count()
      if (count > 0) {
        const elementDetails = await actualElementWithClass.evaluateAll(els =>
          els.map(el => ({
            tag: el.tagName,
            id: el.id,
            classes: el.className,
            text: el.textContent?.substring(0, 50),
            selector:
              el.tagName.toLowerCase() +
              (el.id ? `#${el.id}` : "") +
              (el.className ? `.${el.className.replace(/\s+/g, ".")}` : ""),
          }))
        )
        console.log(`Expected element to have class: ${thirdH2}`)
        console.log(
          `Found ${count} elements with ping class instead:`,
          JSON.stringify(elementDetails, null, 2)
        )
      }
      throw error
    }

    // Check if any other element has the class when it shouldn't
    const wrongElementsWithClass3 = page.locator(
      `:not(h2:nth-child(3)):has-text("").jump-scroll-ping, :not(h2:nth-child(3)):has-text("").jump-scroll-ping-*`
    )
    const wrongElementCount3 = await wrongElementsWithClass3.count()
    expect(
      wrongElementCount3,
      `Found ${wrongElementCount3} other elements with the ping class`
    ).toBe(0)
  })

  test("should navigate between paragraphs with ]p and [p", async ({
    page,
  }) => {
    // Navigate to the paragraph section
    await page.click('a[href="#section3"]')

    // Press ]p to move to the first paragraph in the section
    await page.keyboard.press("]")
    await page.keyboard.press("p")

    // Wait for the first paragraph to be highlighted
    const firstP = page.locator("#section3 p").first()
    await expect(
      firstP,
      "Expected first paragraph to have class jump-scroll-ping"
    ).toHaveClass(/jump-scroll-ping/, { timeout: 3000 })

    // Check if the class exists elsewhere
    const elementWithClass = page.locator(
      ".jump-scroll-ping, .jump-scroll-ping-*"
    )
    const count = await elementWithClass.count()
    if (count > 1) {
      const innerHTML = await elementWithClass.evaluateAll(els =>
        els.map(el => ({ tag: el.tagName, id: el.id, classes: el.className }))
      )
      console.log(`Found ${count} elements with ping class:`, innerHTML)
    }
    expect(
      count,
      `Expected exactly 1 element with ping class, found ${count}`
    ).toBe(1)

    // Press ]p again to move to the second paragraph
    await page.keyboard.press("]")
    await page.keyboard.press("p")

    // Verify we moved to the second paragraph
    const secondP = page.locator("#section3 p").nth(1)
    await expect(
      secondP,
      "Expected second paragraph to have class jump-scroll-ping"
    ).toHaveClass(/jump-scroll-ping/, { timeout: 3000 })

    // Check if the class exists elsewhere
    const elementWithClass2 = page.locator(
      ".jump-scroll-ping, .jump-scroll-ping-*"
    )
    const count2 = await elementWithClass2.count()
    if (count2 > 1) {
      const innerHTML = await elementWithClass2.evaluateAll(els =>
        els.map(el => ({ tag: el.tagName, id: el.id, classes: el.className }))
      )
      console.log(`Found ${count2} elements with ping class:`, innerHTML)
    }
    expect(
      count2,
      `Expected exactly 1 element with ping class, found ${count2}`
    ).toBe(1)

    // Navigate back with [p
    await page.keyboard.press("[")
    await page.keyboard.press("p")

    // Verify we moved back to the first paragraph
    await expect(
      firstP,
      "Expected first paragraph to have class jump-scroll-ping"
    ).toHaveClass(/jump-scroll-ping/, { timeout: 3000 })

    // Check if the class exists elsewhere
    const elementWithClass3 = page.locator(
      ".jump-scroll-ping, .jump-scroll-ping-*"
    )
    const count3 = await elementWithClass3.count()
    if (count3 > 1) {
      const innerHTML = await elementWithClass3.evaluateAll(els =>
        els.map(el => ({ tag: el.tagName, id: el.id, classes: el.className }))
      )
      console.log(`Found ${count3} elements with ping class:`, innerHTML)
    }
    expect(
      count3,
      `Expected exactly 1 element with ping class, found ${count3}`
    ).toBe(1)
  })
  test("should navigate between buttons with ]b and [b without looping", async ({
    page,
  }) => {
    // Navigate to the interactive section
    await page.click('a[href="#section2"]')

    // Press ]b to focus the first button
    await page.keyboard.press("]")
    await page.keyboard.press("b")

    // Verify the first button is focused
    await expect(page.locator("#button1")).toBeFocused()

    // Press ]b again to focus the second button
    await page.keyboard.press("]")
    await page.keyboard.press("b")

    // Verify the second button is focused
    await expect(page.locator("#button2")).toBeFocused()

    // Press ]b again to focus the third button
    await page.keyboard.press("]")
    await page.keyboard.press("b")

    // Verify the third button is focused
    await expect(page.locator("#button3")).toBeFocused()

    // Press ]b again - it should stay on the third button (no looping)
    await page.keyboard.press("]")
    await page.keyboard.press("b")

    // Verify we're still on the third button
    await expect(page.locator("#button3")).toBeFocused()
  })
})
