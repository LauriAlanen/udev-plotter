# 3. UI Filter Interaction Improvements

Date: 2026-09-16

## Status

Accepted

## Context

The filtering system (action chips and subsystem bar chart) had unexpected behavior when dealing with multiple selections and search filters.
1. When a filter was active, and a subsequent search resulted in zero events for that filter, it became "unavailable" and visually locked (`pointer-events: none`). This trapped the UI in a state where the user couldn't deselect the filter without clearing the search box first.
2. If a filter became the only available option remaining (e.g., all current events were of type `bind`), it was still clickable, which allowed meaningless filtering operations that yielded identical results.
3. The Action BarChart component only supported a single `activeKey`. If multiple action filters were selected using the chips, the BarChart lost track of its active state, breaking visual consistency and click logic.

## Decision

We improved the interaction logic for both `Filters.jsx` and `BarChart.jsx`:
1. **Always allow toggling active filters:** If a filter is currently active, it is strictly kept clickable, even if it has no matching events in the current subset. This allows users to undo selections safely.
2. **Disable redundant filtering:** If an item is the *only* available choice (meaning it matches all current events) and is not already active, it is made unclickable to prevent pointless filtering.
3. **Support multiple active bars:** Upgraded `BarChart.jsx` to accept an `activeSet` (Set) instead of just an `activeKey` (string), allowing it to track and correctly display multiple active selections in sync with the action chips.

## Consequences

- Improved UI state consistency across filters and bar charts.
- Prevents the user from becoming locked out of deselection when filtering combinations result in empty intersections.
- The BarChart component is now more reusable and fully supports multi-select interactions.
