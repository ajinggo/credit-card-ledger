# Card Sorting Design

## Goal

Add compact sorting controls to the My Cards section without changing card, bill, repayment, fee, or shared-credit calculations.

## Interface

Use one select control in the card-panel action row. It contains custom order plus ascending and descending variants for card name, monthly usage, available credit, usage rate, bill day, and repayment day.

When custom order is selected, each card shows Move Up and Move Down icon buttons. Boundary buttons are disabled. Other sort modes hide these controls.

## Behavior

- Sorting changes display order only.
- Usage-based sorting follows the dashboard's selected year and month.
- Shared-account cards remain separate sortable cards while retaining pooled usage calculations.
- The selected sort mode is stored locally and restored after reload.
- Custom moves update the underlying cards array and use the existing card save path, so backup and cloud snapshots preserve the custom order.
- Equal values retain the existing custom order as a stable tie-breaker.

## Implementation

Create a small pure `card-sort-model.js` module for sorting and moving cards. Load it before `app.js`. Keep DOM rendering and persistence wiring in `app.js`, and add responsive styles to `organic-liquid.css`.

## Verification

Add Node tests for names, amounts, rates, day ordering, stable ties, and custom movement. Verify the real page at desktop and mobile widths. Do not commit, push GitHub, or deploy Vercel in this iteration.
