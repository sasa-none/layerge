# Migration: v2/v2.x -> v3.0

## 1) fakePath -> url

- Replace `fakePath` with `url`.
- If you used `fakePath` to update query/hash, you can now pass RouteLocationRaw:

```ts
modal.push(Component, { url: { query: { u: '1' }, hash: '#h' } })
```

Notes:
- `url` works for **push/replace only**.
- `open()` ignores `url`.
- If `url` resolves to the same `fullPath`, Layerge no-ops (router-link behavior).

## 2) Prefer open(Component) for view-only overlays

`open(Component)` does not create history entries.
Use it for overlays that should not affect URL/history.

## 3) Controlled hooks (optional)

If you need to block open/close/navigation centrally, use `controlledHooks`.
If you only need observation, keep using v2 hooks.

## 4) LayergeLink unified

If you previously used multiple link components, migrate to a single `<LayergeLink>`.

- Route mode:

```vue
<LayergeLink :to="'/page-b'" action="push" :url="{ query: { u: '1' }, hash: '#h' }">open</LayergeLink>
```

- Component mode:

```vue
<LayergeLink :component="MyOverlay" action="open">open</LayergeLink>
```

