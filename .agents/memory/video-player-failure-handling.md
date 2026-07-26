---
name: Video player failure handling
description: The rule for handling third-party video iframe failures in the study platform.
---

Third-party player iframes must fail closed by replacing the current route with the home route when the iframe errors or does not finish its initial load within the configured timeout. Player close and invalid-link actions should use the same direct home redirect rather than browser history.

**Why:** Cross-origin iframe internals cannot be reliably inspected by the parent page, and browser history can send users back into a broken player route.

**How to apply:** Reuse the shared video guard for every embedded lecture, live-class, and inline video surface.