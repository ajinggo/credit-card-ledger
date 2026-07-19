# Mobile Responsive Design

## Goal

Adapt the complete credit-card ledger for touch-first phone use without removing any existing feature, metric, financial calculation, filter, record field, or data operation. Desktop behavior above 760px remains unchanged.

## Responsive Boundaries

- Desktop and large tablet: wider than 760px, retain the current layout.
- Phone layout: 760px and below.
- Compact phone refinements: 430px and below.
- Required verification viewports: 390x844, 360x800, and 430x932.
- All fixed elements must account for env(safe-area-inset-top) and env(safe-area-inset-bottom).

## Navigation

Reuse the existing four .section-tab controls so view switching, selected state, keyboard semantics, and current application logic remain unchanged.

On phones:

- Keep a compact fixed brand bar at the top.
- Move the existing four-section navigation to a fixed bottom bar.
- Use four stable, equal-width targets labeled 卡片, 手续费, 看板, and 积分.
- Each target is at least 44px high and retains the full accessible name.
- Add page bottom padding equal to the navigation height plus the device safe area.
- Drawers and modals render above both the top brand bar and bottom navigation.

## Global Tools

Replace the phone-only floating bottom tool rail with one icon button in the top brand bar.

- The button opens a compact tool menu anchored below the top-right corner.
- The menu contains the existing account sync, reminders, privacy mode, data backup, and theme controls.
- No tool behavior or permission changes.
- The menu closes when a tool is selected, when the user clicks outside, or when Escape is pressed.
- aria-expanded and aria-controls reflect the open state.
- On desktop, the current vertical side rail remains unchanged.

## Shared Mobile Layout

- Use 12px page gutters and remove desktop-only oversized empty space.
- Use two columns for short numeric metrics when both values fit.
- Use one column for long labels, text summaries, charts, cards, and forms.
- Interactive controls have a minimum 44px touch target.
- Text wraps within its container; no viewport-scaled type and no negative letter spacing.
- The document must never exceed the viewport width.
- Fixed controls must not cover content, alerts, menus, or form actions.

## My Cards

- Keep key amount metrics in a two-column grid.
- Render repayment totals and long reminder content as full-width rows.
- Render each credit card as one full-width item.
- Preserve shared-limit information, utilization, billing dates, annual-fee progress, and every existing action.
- Arrange card actions in a stable two-column touch grid; move controls remain compact icon buttons with accessible labels.
- Card sorting remains available at full width above the list.

## Fee Records

- Keep summary metrics in a two-column grid.
- Keep the primary add action full width.
- Arrange month, filters, display settings, export, and destructive actions in a touch-friendly toolbar that wraps predictably.
- Advanced filters use two columns and collapse to one column at 430px.
- Add a phone-only sort select covering the existing sortable fields and directions.
- Transform the desktop table into a divider-based record list on phones.
- Each row exposes every enabled field with an explicit label; hidden-column preferences continue to apply.
- Date and card identity span the full width, related amounts use two columns, and row actions stay visible at the end.
- Do not require horizontal scrolling to read or operate a record.

## Fee Dashboard

- Hide the decorative desktop graphic and keep the total-fee hero as one compact full-width block.
- Preserve the record count and average-fee hint.
- Keep all six summary metrics in a two-column by three-row grid.
- Keep year and month filters side by side, with wrapping only when required.
- Stack the monthly-fee and card-comparison charts vertically.
- Ensure chart labels and values wrap without clipping.

## Points

- Keep account-level summary metrics in two columns.
- Render loyalty accounts in one column.
- Preserve balances, expiry state, reminder settings, account identity, notes, and all existing operations.
- Arrange repeated actions in stable two-column touch groups.

## Drawers And Forms

On phones, all primary and utility drawers use the full viewport:

- Add/edit card.
- Register/edit bill.
- Add/edit fee record.
- Card summary.
- Add/edit loyalty account.
- Reminders.
- Data backup and recovery.
- Account and cloud sync.
- Card statement.

Each drawer has:

- A fixed or sticky top header with a clear close action.
- One independently scrolling body.
- A fixed or sticky bottom action area when the drawer contains save/cancel commands.
- Single-column fields.
- Safe-area padding.
- No document-level horizontal overflow.

The previously approved behavior that card, bill, and card-summary drawers cover the desktop navigation remains intact.

## Data And Behavior

- No financial formulas change.
- No local-storage or cloud schema changes.
- Existing cardId, shared-limit, billing, repayment, fee visibility, backup, and Supabase synchronization behavior remains intact.
- Mobile navigation and sorting are presentation controls over existing state, not new persisted data.

## Accessibility

- Preserve tab roles and aria-selected for section navigation.
- The mobile tool menu exposes accurate expanded state.
- All icon-only controls have accessible names and visible focus states.
- Touch targets are at least 44px.
- Drawers keep their current dialog labels and keyboard close behavior.
- Reduced-motion behavior remains supported.

## Verification

Automated regression coverage must assert:

- Fixed bottom navigation and safe-area spacing below 760px.
- Compact top brand bar and mobile tool-menu states.
- Two-column metric grids and one-column chart/card layouts.
- Record rows become labeled list layouts without horizontal table width.
- Phone-only sort control maps to existing sort state.
- Every specified drawer becomes full-screen and single-column.
- Desktop selectors remain scoped outside the phone media query.

Browser verification must cover all four views at 390x844, 360x800, and 430x932, plus representative drawers. Each check verifies:

- scrollWidth equals clientWidth.
- Bottom navigation does not overlap the final content.
- Tool menu opens and closes correctly.
- Navigation switches all four views.
- Forms retain visible headers and actions while their body scrolls.
- Long card names, amounts, points, and notes wrap without clipping.
- Light and dark themes remain readable.

## Delivery

After implementation and fresh verification, commit the complete local change set and push it to the existing GitHub repository. Do not create a new repository or change the deployment architecture.
