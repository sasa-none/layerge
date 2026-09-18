# Design Notes (v1.x)

This page captures the v1.x design decisions that are meant to stay stable.

## 1) Scope / non-goals

- Layerge does **not** provide a separate internal router (e.g. memory history) as part of the library.
- The source of truth for routing remains the host app's Vue Router.
- `LayergeView` is intended to be mounted once at the app root. The overlay is viewport-based (`position: fixed`).

If you need "overlay routes" whose `useRoute()` reflects the overlay, use a separate router with `createMemoryHistory()`.

## 1-b) Public entry state: what is deliberately absent

The public entry state (`EntryContext`) is intentionally minimal:

`entryId` / `phase` / `index` / `depth` / `isTop` — and nothing else.

The following were considered and **excluded**:

| Not provided | Why |
|---|---|
| `zIndex` | Derivable from `index` / `depth` / `isTop`. Providing it would imply Layerge owns stacking, which it does not. |
| `mode` | Available from `useLayerge()`. Duplicating it in the entry context invites two sources of truth. |
| `reason` | Encourages branching on internal causes that are not part of the contract. |
| `stackVisible` | An internal rendering decision, not a property of an entry. |

**The reason for excluding them is the same in every case: more state means more ways to be wrong.** Adding a field to the public entry state is a one-way door — see the guardrail in [motivation.ja.md](./motivation.ja.md).

## 1-c) Rendering rule

What gets rendered is the composition of two sets:

```
rendered = visible entries (stack) + entries currently leaving
```

- With `display: 'top'`, "visible" means the top entry only.
- With `display: 'stack+cache'`, "visible" means every entry in the stack.
- **Leaving entries are always rendered, in every mode, for as long as they exist.**

That last rule is what makes leave animations possible at all. If leaving entries were dropped from the render set as soon as close was requested, there would be no element left to animate. Z-order and CSS remain the presenter's responsibility.

## 1-d) Transition hook composition

`<LayergeTransition>` merges its internal notifications with the user's hooks. The order is fixed:

| Event | Order |
|---|---|
| `after-enter` | internal notification → user hook |
| `after-leave` | user hook → internal notification |

**The internal notification runs even if the user's hook throws.** Without that guarantee, one exception in a user hook would leave an overlay stuck open forever — the failure mode this component exists to prevent.

## 2) Display states

Layerge behavior is intentionally explainable as **three states**:

| display        | stack | cache | meaning |
|---|---:|---:|---|
| `top`          | false | false | Render only the top entry (modal-like). |
| `stack`        | true  | false | Stack entries, but do not guarantee underlying render/state. |
| `stack+cache`  | true  | true  | Render underlying layers; state tends to stay (cache). |

Backward compatibility:

- Existing `stack/cache` options are still supported.
- If both `display` and `stack/cache` are provided, `display` wins.
- `cache:true` requires `stack:true` (Layerge throws otherwise).

## 3) `open()` is view-only

- `open(Component|loader)` is the recommended form for overlays like login/settings.
  - It does **not** navigate and does not change the URL.
- `open(RouteLocationRaw)` only guarantees **existence check** (matched>0). It is view-only (URL unchanged) and route-dependent behaviors are out of contract.
  - It is still **view-only** (no navigation).
  - Route-dependent expectations (`useRoute()`, guards, meta, lifecycle hooks, ...) are out of contract for this form.

## 4) Closing semantics

Layerge has two ways to leave presenter mode:

- **`closeTop/closeAll`**: closes presenter entries (this is what an overlay "×" should use).
- **`exit()`**: force-exits presenter mode (advanced). Use it to recover from unexpected states.

### replace-close behavior

When `replace(...,{url})` is used to open a presenter:

- Layerge saves `returnTo = from.fullPath` on the entry.
- Closing the top entry restores URL via `router.replace(returnTo)` by default.

**Important:** `replace()` refers to URL semantics only. Layerge still **stacks** a new presenter entry (it does not overwrite the previous entry).

Advanced:

- `closeTop({restoreUrl:false})` closes UI without touching URL.

## 5) Async consistency

Layerge follows **latest-wins**: stale pending navigations are prevented from committing.
