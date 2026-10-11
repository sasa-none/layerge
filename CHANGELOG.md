# Changelog

## 0.1.0 (2026-10-11)

The first public release of Layerge, as **0.1.0**. Nothing has been published before
it, so this section describes **what the release contains** rather than how it differs
from a previous one. There is no earlier version for anything here to be added to,
removed from, or fixed relative to. At publication this heading becomes `## 0.1.0`
with the actual release date.

Layerge is released at 0.x on purpose. It is being put into real projects first, and
the API will be cut and reshaped by what those projects actually need before anything
is frozen at 1.0.0. Expect breaking changes between minor versions; each one is
recorded here.

The development history that led here is in the repository's git log, and a labelled
snapshot of one earlier phase is kept at the end of this file.

### Presenter navigation

- `createLayergeRouter({router, presenters, ...})` extends a Vue Router instance with
  presenter navigation. It adds `router[presenterName]`, `router.$layerge`,
  `router.exitPresenterMode()` and `router.getLayergeState()`.
- Each presenter exposes `push`, `replace` and `open`, plus the async forms
  `pushAsync` and `closeAsync`.
- `open` is **view-only**: it renders a target over the current route and never
  navigates. `open(RouteLocationRaw)` is accepted only for the current route, so the
  URL and the content cannot disagree.
- `target` accepts a loader (`() => import('./Overlay.vue')`, recommended), a Vue
  component, or a `RouteLocationRaw`.
- The `url` option lets `push` / `replace` move the URL while rendering the component
  you gave them, which is what makes an overlay survive a reload and respond to the
  back button. It accepts a string or a `RouteLocationRaw`.
- `closeTop({restoreUrl?})` / `closeAll({restoreUrl?})` close entries, and `returnTo`
  (default: `from.fullPath`) decides where the URL is restored to.

### Display modes

- `display: 'top' | 'stack' | 'stack+cache'` configures a presenter, either as the
  router-wide default or per presenter definition. `'stack'` keeps lower layers in the
  stack for close and history without rendering them; `'stack+cache'` also keeps their
  component state alive.

### Latest wins

- When a newer presenter navigation starts while an older one is still pending — guard
  delays, a slow loader, rapid clicks — the older one is **superseded** and does not
  commit. Stale navigations cannot roll Layerge's state backwards, and a navigation
  that the router cancels or fails does not commit either.

### Operation outcomes

- `push` / `replace` / `open` return a handle with `close()`, `closed`, `result` and
  `isActive`. `result` resolves when the operation itself settles, with one of
  `completed`, `aborted`, `failed` or `superseded`; `closed` resolves when the entry
  has actually closed. `pushAsync` and `closeAsync` return the same four-value result
  directly. These four values are the entire public status surface.

### Leave animations

- Entries being closed are retained in the DOM until their leave transition reports
  completion, so a leave animation is never cut off by the navigation that triggered
  it. `<LayergeTransition>` wires the notifications for you; `<LayergeView>` renders
  the overlay root; `<LayergeLink>` provides a `RouterLink`-compatible trigger.

### Composables

- `usePresenter`, `useLayerge`, `usePresenterBindings`, `useLayergeLink` and
  `usePresenterLeaveGuard`. `usePresenterBindings()` is the supported way to read the
  public entry state; `usePresenterLeaveGuard()` lets a presenter block or defer its
  own close.

### Opt-in control

- `controlledHooks` (`beforeOpen`, `beforeNavigate`, `beforeClose`) can cancel an
  operation before it commits.
- `preMounted`, `keepMounted` and `mountPreset` control when a presenter's DOM is
  created and whether it is kept on close.
- `debug: true` enables development logging, and decision traces record why a given
  operation reached its outcome. Both are development-only and carry bounded buffers.

### Packaging

- Ships ESM and CommonJS builds with TypeScript definitions generated from the
  sources. The definitions resolve under `moduleResolution: "bundler"` and under
  `"node16"` / `"nodenext"` for both the `import` and `require` conditions; a
  TypeScript consumer is type-checked against the packed tarball in CI with
  `skipLibCheck: false`.
- Peer range is `vue@^3.4` with `vue-router@^4.2 || ^5.0`, and both router majors are
  verified by consumer install-and-build checks against the packed tarball. Requires
  Node 20 or newer.

### Notes

- Runtime objects carry members that the published type definitions do not declare.
  The type definitions are the contract; anything absent from them is internal and may
  change in any release. See "Internal members" in the README.
- A `url` that points at a path with no matching route will 404 on reload unless your
  app provides a catch-all or a bridge route. The demo shows both.
- Server-side rendering is out of scope, and behaviour across multiple tabs is
  undefined.

---

The section below is a snapshot of a development phase from before the package was
published. It is kept as a record of how the design arrived where it did, and it is
**not a description of the released API** — some of what it mentions, such as the
`fakePath` option, does not exist in the published package. It is left unedited on
purpose.

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
