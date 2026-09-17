# Changelog

## 1.0.0 (2026-05-28)

### Added

- New presenter option `display: 'top' | 'stack' | 'stack+cache'` (recommended). Existing `stack/cache` remain supported for compatibility.
- URL restoration on close for `replace(...,{fakePath})` via `returnTo` (default: `from.fullPath`).
- Advanced close options: `closeTop({restoreUrl?: boolean})` / `closeAll({restoreUrl?: boolean})`.
- Expanded E2E coverage to lock the above behaviors (Playwright).

### Changed

- `open()` is documented and treated as **view-only**: it never navigates.
  - `open(Component|loader)` is the recommended form.
  - `open(RouteLocationRaw)` is allowed only for the **current** route to avoid URL/content mismatch.
- Clarified separation of responsibilities: `closeTop/closeAll` (user close) vs `exit()` (force exit).

### Notes

- If both `display` and `stack/cache` are provided, `display` wins.
- `open(...,{fakePath})` is ignored (dev warns when `debug:true`).

## Pre-public milestone 1.1.0 (2026-01-05)

### Added

- Unified `open/push/replace(target, options?)` signature.
- `target` now accepts:
  - `RouteLocationRaw` (`string | object`)
  - Vue `Component`
  - loader `() => import('...')` (recommended)
- `fakePath` support for URL integration:
  - `push/replace(Component|loader, {fakePath})` navigates to `fakePath` while rendering the provided component.
  - `open(..., {fakePath})` is ignored (dev-only warn when `debug:true`).
- Async consistency guard:
  - stale navigation commits are prevented (guard delays / rapid operations won’t roll back Layerge state)
  - navigation failure/cancel does not commit.
- E2E smoke test via Playwright (demo-based).

### Changed

- Presenter re-entrancy behavior:
  - When a new presenter navigation starts, an existing pending navigation is cancelled so the latest operation wins.

### Fixed

- (Internal) Allows `fakePath` to be unmatched by router records when the overlay is rendered from `Component/loader`.

### Notes

- No breaking changes intended for existing v1 usage.
- For best URL restoration on refresh, add a catch-all route in your app if you plan to use `fakePath`.
