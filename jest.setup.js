// This file runs before each test file.
// It extends Jest's `expect` with powerful custom matchers from jest-dom,
// which is a companion library usually installed with Testing Library.
// While not strictly required for this setup, it's a best practice.
// For now, we can just import the main library to make `screen` globally available if needed.
require("@testing-library/dom")
