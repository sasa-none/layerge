# Migration Guide (v1.x)

This guide highlights **behavioral contracts** and **recommended updates** when moving from v1.1.0 to newer v1.x builds.

## 1) Prefer `display` over `stack/cache`

Presenter config supports a single, more readable option:

```js
presenters:{
  modal:{ component:OverlayPresenter, display:'top' },
  stackCard:{ component:StackCardPresenter, display:'stack+cache' }
}
```

Equivalent mapping (behavioral intent):

| display       | stack | cache |
|---|---:|---:|
| `top`         | false | false |
| `stack`       | true  | false |
| `stack+cache` | true  | true  |

Notes:

- Old `stack/cache` are still supported for compatibility.
- If both are provided, `display` wins.
- `cache:true` still requires `stack:true` (throws otherwise).

## 2) `open()` is view-only

- Prefer `open(Component|loader)` for overlays (login/settings, etc.). URL never changes.
- `open(RouteLocationRaw)` remains available. It only guarantees an **existence check** (matched>0) and is view-only (no navigation / URL unchanged). Route-dependent behaviors are out of contract.
  - Do not rely on route-dependent behavior (`useRoute()`, guards, lifecycle hooks, meta, ...).

If you need a separate routing space for overlays, use Vue Router's memory history and an isolated router (Layerge does not provide this).

## 3) Closing: `closeTop/closeAll` vs `exit()`

- `closeTop/closeAll`: "×" behavior (close presenter entries).
- `exit()`: advanced recovery tool (force-exit presenter mode).

URL restoration depends on how the top entry was opened:

- `open(...)`: URL unchanged.
- `push(...,{fakePath})`: behaves like browser back.
- `replace(...,{fakePath})`: restores `returnTo` via `router.replace(returnTo)` (default `from.fullPath`).

Advanced:

```js
layerge.closeTop({restoreUrl:false});
```

This closes UI without touching the URL.

## 4) Note on presenter `replace()`

**Important:** `replace()` refers to URL semantics only. In Layerge, it is treated as a **stacking** action (it does not overwrite the previous presenter entry in the internal stack).

## 5) Layout assumption

`LayergeView` overlay root is viewport-based (`position: fixed`) and is intended to be mounted once at the app root.

## 6) Presenter helpers: `usePresenterBindings()` and `<LayergeTransition>`

v1.x introduces two recommended helpers to reduce mistakes:

- `usePresenterBindings()` maps a minimal, stable entry context (`entryId/phase/index/depth/isTop`) to `v-bind` props/attrs.
- `<LayergeTransition>` wraps Vue's `<Transition>` and guarantees internal enter/leave notifications even if you attach your own hooks.

These helpers are designed to keep the boundary clear:

- Layerge owns state and lifecycle guarantees
- Presenters own UI and animation
