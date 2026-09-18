# Changelog

## Unreleased

### Changed

- Type definitions are now generated from the TypeScript sources instead of being hand-written, and internal members are stripped from them. Members that were already declared `/** @internal */` — `$layerge.pending`, `$layerge._closeTop` / `_closeAll` / `_closeById` / `_exitPresenterMode` / `_setInvoker` / `_getInvoker` / `_deleteInvoker` / `_notifyEnterDone` / `_notifyLeaveDone` / `_invokers` / `_kept`, and `PresenterEntry._mountKey` / `_leavingIndex` / `_leavingDepth` / `_preMounted` / `_keepMounted` / `_isHidden` / `_keepKey` — no longer appear in the published types. **TypeScript code that reached for them now fails to compile.** They were never part of the public contract: the previous hand-written `index.d.ts` already marked them `@internal`, and the README states that the `_`-prefixed members of `router.$layerge` are internal. Runtime behaviour is unchanged.

### Removed

- The deprecated `fakePath` option is gone from `push` / `replace`. Use `url`, which does the same thing and also accepts a `RouteLocationRaw`. `fakePath` was never part of a published release — the package has not been published — so no existing code can depend on it, and keeping it until 1.0.0 would have made removal a breaking change. The development warning emitted by `open()` now reads `open() ignores url.` (it previously named `fakePath` and referred to a version that was never released).

### Fixed

- Dev diagnostics no longer drop the navigation error when closing a presenter. If URL restore fails during `close()`, the `[Layerge][error]` line now carries the actual error (with its stack) instead of only the outcome summary. Development-only output; no public API change.

- `settled` (and therefore `pushAsync()` / `closeAsync()`) now resolves with a plain status string on failure. Two failure paths previously put the whole internal outcome object into `status`, so `settled` resolved with `{status: {traceId: '...', status: 'failed'}}` instead of `{status: 'failed'}`. Code such as `if (result.status === 'failed')` never matched, which meant **failures could not be detected through the API whose purpose is to report them**. Success paths were unaffected.

- `usePresenter()` now returns a no-op handle that includes `settled` when called outside a presenter. It resolves immediately with `{status: 'aborted'}`, matching the `PresenterHandle` contract that `index.d.ts` already declares. Previously `settled` was `undefined` there, so `usePresenter().handle.settled.then(...)` threw outside a presenter and callers were forced to branch — which defeats the purpose of the no-op handle.

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
