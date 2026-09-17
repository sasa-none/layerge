# V1.x Notes (internal)

This document summarizes the v1.x improvements after v1.1.0 for internal reference.

## What changed

### `display` option (recommended)

Presenters can now be configured with a single, more readable option:

```js
display:'top' | 'stack' | 'stack+cache'
```

Old `stack/cache` are still supported for compatibility; if both are provided, `display` wins.

### `open()` is view-only

- `open(Component|loader)` is the recommended form for overlays (login/settings). It never navigates.
- `open(RouteLocationRaw)` only guarantees an **existence check** (matched>0) and remains view-only (no navigation / URL unchanged). Do not rely on guards/lifecycle/meta for this form.

### Close semantics / URL restoration

- `closeTop/closeAll` are the intended "×" operations.
- `exit()` is an advanced recovery tool.
- `replace(...,{fakePath})` stores `returnTo` (default `from.fullPath`) and restores URL on close via `router.replace(returnTo)`.

Advanced:

```js
layerge.closeTop({restoreUrl:false});
```

**Important:** `replace()` refers to URL semantics only. Layerge still stacks a new presenter entry (it does not overwrite the previous entry).

### Layout

`LayergeView` overlay root is viewport-based (`position: fixed`) and is intended to be mounted once at the app root.

### Tests

E2E coverage has been expanded to lock:

- replace-close returnTo restoration
- restoreUrl on/off behavior
- mixed open/push/replace stacks
- race/cancel scenarios (latest-wins)
