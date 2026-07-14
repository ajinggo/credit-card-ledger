# Card Sorting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent card sorting and custom card ordering to the My Cards section.

**Architecture:** Put deterministic sorting and movement in a pure browser/CommonJS model. Keep selected sort preference and DOM wiring in `app.js`, while the existing cards array remains the source of custom order.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Node.js built-in test runner, Local Storage

---

### Task 1: Pure card sort model

**Files:**
- Create: `card-sort-model.js`
- Create: `tests/card-sort-model.test.cjs`

- [x] Write tests that call `sortCards(cards, mode, metricsById)` for name, usage, available credit, usage rate, bill day, due day, and stable ties, plus `moveCard(cards, cardId, direction)` for custom movement.
- [x] Run `node --test tests/card-sort-model.test.cjs` and confirm it fails because `card-sort-model.js` does not exist.
- [x] Implement `sortCards` without mutating the input and `moveCard` with no-op boundary handling.
- [x] Run `node --test tests/card-sort-model.test.cjs` and confirm all tests pass.

### Task 2: Sorting interface and persistence

**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [x] Add a labeled `#cardSortSelect` with the thirteen approved options to `.card-panel-actions` and load `card-sort-model.js` before `app.js`.
- [x] Add `CARD_SORT_KEY`, restore a valid mode or default to `custom`, and persist changes with `localStorage.setItem(CARD_SORT_KEY, cardSortMode)`.
- [x] Build period metrics from `cardUsageForSelectedPeriod(card)` and render a sorted copy returned by `CardSortModel.sortCards`.
- [x] Render unique accessible Move Up and Move Down buttons only in custom mode; call `moveCard`, save cards, and rerender after movement.
- [x] Preserve the rendered-card mapping when assigning safe card names and policy text, rather than indexing the unsorted `cards` array.

### Task 3: Responsive styling and verification

**Files:**
- Modify: `organic-liquid.css`
- Modify: `index.html`

- [x] Style `.card-sort-control` as a compact labeled select aligned with the existing action row and make it full-width without overflow on small screens.
- [x] Style custom move buttons as stable square icon controls with clear disabled states.
- [x] Increment local cache keys for changed CSS and JavaScript assets.
- [x] Run model tests, existing regressions, JavaScript syntax checks, and `git diff --check`.
- [x] Start a local server and verify desktop and mobile sorting, persistence, custom movement, and console errors in the browser.
- [x] Leave every change uncommitted and do not push GitHub or deploy Vercel.
