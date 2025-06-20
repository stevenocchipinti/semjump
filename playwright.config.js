// @ts-check
const { defineConfig, devices } = require("@playwright/test")

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: "./tests/e2e",
  // Maximum time one test can run for
  timeout: 30 * 1000,
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000,
  },
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: "line",

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    /* Test against other browsers if needed:
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */
  ],

  // Use a simple static server to serve test pages
  webServer: {
    command: "node tests/server.js",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})

