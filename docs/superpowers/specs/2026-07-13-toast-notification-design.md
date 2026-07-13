# Toast Notification Redesign

## Goal

Keep save confirmations fully visible after adding or editing ledger items, without covering the fixed navigation or shifting page content.

## Root Cause

The toast currently starts at `top: 1.5rem` with `z-index: 100`. The fixed header occupies the same area at `z-index: 190`, while the organic page texture uses `z-index: 400`. The toast therefore appears underneath the header and can look partially or fully hidden.

## Selected Direction

Use a centered floating notification immediately below the fixed header.

- Position the toast at `calc(var(--fixed-header-offset) + 0.75rem)`.
- Keep it centered with a responsive maximum width.
- Set its stacking level above the fixed header, drawers, and page texture, but below the authentication overlay.
- Use a light frosted surface with dark text and a green circular success icon.
- Use a red accent and icon for errors while keeping the same layout.
- Preserve the existing message API, accessibility status region, and 2.6-second timeout.

## Responsive Behavior

The existing `--fixed-header-offset` variable changes at desktop and mobile breakpoints. The toast uses that variable instead of hard-coded desktop or mobile positions. Its maximum width is `calc(100vw - 2rem)`, and long messages may wrap without leaving the viewport.

## Motion

The hidden state is slightly raised and transparent. The visible state settles downward into its final position. The animation only changes opacity and transform, so it does not reflow the page.

## Verification

- Trigger a save confirmation in the fee-entry workflow.
- Confirm the toast top edge is below the fixed header bottom edge.
- Confirm it remains inside desktop and mobile viewport widths.
- Confirm success and error variants remain readable in light and dark themes.
- Confirm the toast does not intercept clicks and disappears after the existing timeout.
