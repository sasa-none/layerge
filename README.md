# Layerge

Layerge is a Vue Router extension that adds **presenter-style navigation** (overlay / stacked overlays) with a minimal API.

> **Status: 0.x, experimental.** Layerge is published so that it can be used in real
> projects and shaped by what they need. The API is expected to change between minor
> versions, and no compatibility promise is made until 1.0.0. It is going into the
> author's own projects first; you are welcome to use it too, but pin the exact version
> and read the changelog on every update.

- Written in **TypeScript**. Type declarations are generated from the source at build time, for both ESM and CJS consumers.
- Presenter behavior is configured with a single `display` option.
- URL integration uses `url`; `mountPreset` controls mounting; `controlledHooks` can cancel operations.
- This README is the canonical guide. A VitePress docs site is planned later.

## Why Layerge?

Vue Router manages the mapping between URLs and *pages*. That is the right job for it, and Layerge does not try to replace it.

But real applications also have UI that is not a page, yet behaves like navigation: modals, detail panels, wizards, stacked cards. These share an awkward set of expectations — the browser back button should close them, a shared URL should sometimes reopen them, and yet defining a route for each one is far too heavy.

Without a dedicated mechanism, you end up with one of two problems:

- **Hand-rolled state** (`v-if` plus a store): the open/closed state lives outside history, so back navigates away instead of closing, a reload loses the overlay, and you write synchronization code that eventually breaks — because nothing decides which side wins when they disagree.
- **Nested routes**: the route table balloons, overlays that should appear above *any* page have no natural place in the hierarchy, and the destination after closing is not uniquely determined.

Layerge fills that gap as a **router extension**:

| Problem | What Layerge provides |
|---|---|
| Overlay state detached from history | `push` / `replace` integrate with router history, so Back closes the overlay |
| Route tables bloated by overlays | `open(Component)` / `open(loader)` need no route definition |
| Ambiguous destination after closing | `replace` records a `returnTo` and restores the URL on close |
| Races while a guard is pending | **Latest wins** — stale operations are prevented from committing |
| Leave animations cut short | Leaving DOM is retained, and `<LayergeTransition>` handles the notifications |

### What Layerge deliberately does not do

These are design decisions, not missing features:

- **No UI.** Z-index, CSS, animation, layout and confirm dialogs are yours. The look of an overlay is what makes an application distinctive, and a library that decides it becomes something you fight.
- **No internal router.** If you need `useRoute()` to reflect an overlay route, use Vue Router's `createMemoryHistory()` with a separate instance. Embedding a router here would create a second source of truth — reintroducing the very synchronization problem above.
- **No accessibility automation.** `aria-expanded` / `aria-controls` depend on your UI structure and cannot be inferred from the library.
- **No API added for convenience alone.** A published contract cannot be withdrawn.

### When not to use Layerge

- You have a single overlay and do not need history integration — `v-if` is enough.
- You want a ready-made modal UI — use a library that ships one; Layerge intentionally ships none.
- You need overlays scoped to a container rather than the viewport — `LayergeView` is viewport-based (`position: fixed`) and is mounted once at the app root.

> The full design rationale is documented in Japanese in [docs/motivation.ja.md](./docs/motivation.ja.md).

## Install

```bash
npm i layerge
```

This package expects these peer deps:

- `vue`
- `vue-router`

Validated in this release candidate with:

- `vue@3`
- `vue-router@4`
- `vue-router@5`

`vue-router@5` support is verified here by packed-tarball consumer install/build checks.
If your app still uses legacy `next()`-style guards, Vue Router 5 may emit deprecation warnings at runtime; that cleanup is separate from Layerge's packaging compatibility.

## Quick Start

```js
import {createApp} from 'vue';
import {createRouter,createWebHistory} from 'vue-router';
import {createLayergeRouter,LayergeView} from 'layerge';

import App from './App.vue';

const router = createLayergeRouter({
    router:createRouter({
        history:createWebHistory(),
        routes:[
            // ... your routes
        ]
    }),
    presenters:{
        modal:{
            component:MyOverlayPresenter
        }
    }
});

const app = createApp(App);
app.use(router);
app.mount('#app');
```

Place `LayergeView` once in your app layout:

```vue
<template>
    <LayergeView />
</template>
```

> LayergeView is intended to be mounted once at the app root.
> The overlay root is viewport-based (`position: fixed`). Container-scoped overlays are out of scope.

> `createLayergeRouter()` automatically wires provide / global registration via Vue Router's `install()`.

## Everyday usage

In most apps you only need **these two helpers**:

1. `usePresenterBindings()` – map the current entry context to `v-bind` props/attrs
2. `<LayergeTransition>` – guarantee enter/leave notifications without writing `notify*Done` by hand

### `usePresenterBindings()`

Inside a presenter subtree:

```js
import {usePresenterBindings} from 'layerge';

const bindings = usePresenterBindings((entry) => {
  return {
    class: {isTop: entry.isTop},
    style: {zIndex: 1000 + entry.index},
    'data-phase': entry.phase,
  };
});

// template: <div v-bind="bindings"> ... </div>
```

`usePresenterBindings()` is also the *official* way to access the minimal **public entry state**.

### `<LayergeTransition>`

Wrap your presenter UI with `<LayergeTransition>` instead of `<Transition>`:

```vue
<template>
  <LayergeTransition name="fade" appear>
    <YourOverlayContent />
  </LayergeTransition>
</template>
```

If you do **not** need animations, you can omit `<LayergeTransition>` entirely.
In that case, Layerge auto-completes `enter/leave` so the overlay will not get stuck.

It merges your transition hooks and internal notifications safely:

- `after-enter`: internal → user
- `after-leave`: user → internal

So even if you attach `@after-enter/@after-leave`, Layerge notifications still run.

## Public API

> All of the following is available in the published package. During 0.x, any of it may change between minor versions — see the changelog.

### `createLayergeRouter(options)`

Wraps a Vue Router instance and returns it augmented with Layerge. The returned router is the same object you pass to `app.use()`.

```js
const router = createLayergeRouter({
    router: createRouter({history: createWebHistory(), routes}),
    presenters: {
        modal: {component: OverlayPresenter, display: 'top'}
    }
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `router` | `Router` | *(required)* | The Vue Router instance to extend. |
| `presenters` | `Record<string, PresenterDefinition>` | `{}` | Presenter definitions. Each key becomes `router[key]`. |
| `display` | `'top' \| 'stack' \| 'stack+cache'` | — | Default display mode for presenters that do not set their own. |
| `presenterDefaults` | `{preMounted?, keepMounted?, mountPreset?}` | — | Default mount strategy for all presenters. See [Mount strategy](#mount-strategy). |
| `controlledHooks` | `LayergeControlledHooks` | — | Opt-in hooks that can cancel operations. See [controlledHooks](#controlledhooks). |
| `backgroundCompare` | `'fullPath' \| 'path'` | `'fullPath'` | How the background route is compared. Use `'path'` to ignore query and hash. |
| `debug` | `boolean` | `false` | Enables development logging. |

It adds to the router:

- `router[presenterName]` — the presenter API described below
- `router.$layerge` — the internal store. Read it for debugging; do not depend on it. See [Internal members](#internal-members).
- `router.exitPresenterMode()` — force-exit presenter mode
- `router.getLayergeState()` — returns `{mode, depth}`

### Presenter definition

```js
presenters: {
    modal: {
        component: OverlayPresenter,
        display: 'top'
    },
    stackCard: {
        component: StackCardPresenter,
        display: 'stack+cache'
    }
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `component` | `Component` | *(required)* | The presenter component. Throws if missing. |
| `display` | `'top' \| 'stack' \| 'stack+cache'` | inherits root `display` | Display mode. See [display](#display). |

> Mount strategy is **not** configurable per presenter definition. Set it globally via `presenterDefaults`, or per call via the options below.

### Presenter API

Each presenter key exposes:

```ts
router.modal.push(target, options?)    : PresenterHandle
router.modal.replace(target, options?) : PresenterHandle
router.modal.open(target, options?)    : PresenterHandle

router.modal.pushAsync(target, options?)        : Promise<PresenterAsyncResult>
router.modal.closeAsync(entryId, {restoreUrl?}) : Promise<PresenterAsyncResult>
```

There is no `replaceAsync` or `openAsync` — `pushAsync` and `closeAsync` are the only async entry points.

#### `target`

| Form | Meaning |
|---|---|
| `() => import('./Overlay.vue')` | Loader. **Recommended.** |
| `Component` | A Vue component. |
| `RouteLocationRaw` (`string \| object`) | A route. For `open()` this is view-only — see below. |

#### `options`

| Option | Type | Applies to | Description |
|---|---|---|---|
| `url` | `string \| RouteLocationRaw` | `push` / `replace` | Navigates to this URL while rendering `target`. See [url](#url). |
| `preMounted` | `boolean` | all | Allows the DOM to exist before the overlay becomes active (hidden until shown). |
| `keepMounted` | `boolean` | all | On close, hide instead of unmounting, so re-opening does not remount. |
| `mountPreset` | `'default' \| 'keep' \| 'pre' \| 'prekeep'` | all | Shorthand for the two flags above. |

`open()` ignores `url` and warns in development.

### `PresenterHandle`

Returned by `push` / `replace` / `open`.

| Member | Type | Description |
|---|---|---|
| `close()` | `() => void` | Closes this entry. |
| `closed` | `Promise<void>` | Resolves when the entry has closed. |
| `result` | `Promise<PresenterAsyncResult>` | Resolves when **this operation** — the `open` / `push` / `replace` that returned the handle — reaches its final state. It does **not** wait for the entry to close. |
| `isActive` | `boolean` | Whether this entry is still active. |

`PresenterAsyncResult` is `{status: 'completed' | 'aborted' | 'failed' | 'superseded'}`. These four values are the entire public status surface and will not be extended.

When each value is used:

| Status | When |
|---|---|
| `completed` | The operation committed. |
| `superseded` | A newer presenter operation started while this one was still pending, so this one lost (latest wins). |
| `failed` | The operation threw — for example a navigation guard raised an error. |
| `aborted` | The operation did not proceed. This includes **a navigation failure reported by the router**, and anything the library treats internally as "nothing happened". |

> Note the last row. A router-reported navigation failure resolves as **`aborted`, not `failed`**. If you are branching on the outcome, do not assume that every unsuccessful operation is `failed` — check for the outcome you care about, or treat anything other than `completed` as unsuccessful.

#### `result` vs `closed`

They answer different questions, and `result` is the one that is easy to misread.

| Question | Member | Resolves with |
|---|---|---|
| Did the operation I just started succeed? | `result` | a `PresenterAsyncResult` |
| Has this entry gone away? | `closed` | nothing (`void`) |

`result` resolves as soon as **the operation is decided** — committed, cancelled by a guard, superseded by a newer operation, or failed. The overlay is still on screen at that moment. It says nothing about how or when the entry is later closed.

For `push`, `pushAsync()` returns exactly the same outcome, so use whichever reads better:

```js
const result = await router.modal.pushAsync('/page-a');
// same outcome as
const result = await router.modal.push('/page-a').result;
```

There is no `openAsync` or `replaceAsync`, so for `open` and `replace` the handle's `result` is the only way to await the outcome.

`closed` tells you the entry is gone, not how it went — it resolves with no value. If **you** close an entry, `closeAsync(entryId)` reports that close's outcome. Note that the hook named `settled` on `useLayergeLink` is a different thing again: it fires when a link's whole lifecycle reaches a terminal state, including the close (see [useLayergeLink](#uselayergelinkto-computeattrs-hooks)).

### `url`

`url` changes the URL for history integration while Layerge renders whatever `target` you gave it.

```js
router.modal.push(() => import('./SettingsModal.vue'), {url: '/modal/settings'});
router.modal.replace(() => import('./SettingsModal.vue'), {url: {query: {tab: 'billing'}}});
```

- Applies to `push` and `replace` only.
- Accepts a string or a `RouteLocationRaw`. A partial location (only `query` / `hash`) is merged with the current route before being resolved.
- If the resolved location has the same `fullPath` as the current route, Layerge **no-ops** rather than adding a history entry.
- The rendered overlay lives in memory. On reload, Vue Router renders whatever your route table maps that URL to — add a catch-all route if you rely on this. See [url refresh and routing strategies](#url-refresh-and-routing-strategies).

### Mount strategy

`preMounted` and `keepMounted` control when the presenter component exists in the DOM. Both default to `false`.

`mountPreset` expands to them:

| preset | `preMounted` | `keepMounted` |
|---|---:|---:|
| `default` | false | false |
| `keep` | false | true |
| `pre` | true | false |
| `prekeep` | true | true |

Resolution order — the first match wins, and the two flags are always resolved **together**:

1. `mountPreset` passed at the call site
2. `preMounted` / `keepMounted` passed at the call site
3. `mountPreset` in `presenterDefaults`
4. `preMounted` / `keepMounted` in `presenterDefaults`
5. Fallback: both `false`

> Because a match at any level supplies both flags, setting only `preMounted` at the call site resets `keepMounted` to `false` rather than inheriting it from `presenterDefaults`.

### `controlledHooks`

Opt-in, registered globally on `createLayergeRouter`. Unlike notification hooks, these can **cancel** an operation.

```js
createLayergeRouter({
    router,
    presenters,
    controlledHooks: {
        beforeClose: async (ctx) => {
            return await confirmDiscard();  // false cancels the close
        }
    }
});
```

| Hook | When |
|---|---|
| `beforeOpen` | Before an entry opens |
| `beforeClose` | Before an entry closes |
| `beforeNavigate` | Before Layerge navigates |

Each receives `ctx: {entryId, action, signal, fromFullPath?, toFullPath?}` and returns:

| Return | Result |
|---|---|
| `false` | Cancel |
| `true` or `undefined` | Continue |
| `Promise<...>` | Awaited, then treated as above |
| *throws* | Cancel (safe default) |

`ctx.signal` is an `AbortSignal` for latest-wins cancellation. **Do not apply the result of a superseded attempt.**

> Local guards registered with `usePresenterLeaveGuard()` are evaluated **before** the global `controlledHooks`.

## Composables

### `useLayerge()`

Available anywhere in the app. Safe to call even when Layerge is not installed (it then returns inert values).

| Member | Type | Description |
|---|---|---|
| `mode` | `'page' \| 'presenter'` | Current mode. |
| `depth` | `number` | Stack length. |
| `closeTop(options?)` | `(options?: {restoreUrl?: boolean}) => void` | Closes the top entry. This is what an overlay "×" should call. |
| `closeAll(options?)` | `(options?: {restoreUrl?: boolean}) => void` | Closes every entry. |
| `exit()` | `() => void` | Force-exits presenter mode without touching history. Advanced recovery only. |

`restoreUrl` defaults to `true`. See [Closing semantics](#closing-semantics).

### `usePresenter()`

Call inside a presenter component. Outside one it returns inert values, so you do not need to branch.

| Member | Type | Description |
|---|---|---|
| `handle` | `PresenterHandle` | The handle for this entry. |
| `entry` | `PresenterEntry \| null` | The entry record. |
| `isTop` | `boolean` | Whether this entry is on top. |

### `usePresenterBindings(mapper)`

The **official** way to read the public entry state. Call inside a presenter subtree.

```js
const bindings = usePresenterBindings((ctx) => ({
    class: {isTop: ctx.isTop},
    style: {zIndex: 1000 + ctx.index},
    'data-phase': ctx.phase
}));
```

`ctx` is the public `LayergeEntryContext` — and only this:

| Field | Type |
|---|---|
| `entryId` | `string` |
| `phase` | `'enter' \| 'active' \| 'leave'` |
| `index` | `number` |
| `depth` | `number` |
| `isTop` | `boolean` |

Returns a `ComputedRef`, so bind it with `v-bind="bindings"`.

> Calling this outside a presenter **throws in development** and returns an empty object in production.

### `usePresenterLeaveGuard(options?)`

Registers a leave guard for the presenter it is called in. Layerge holds no dirty/pending state of its own — that is the presenter's responsibility.

```js
usePresenterLeaveGuard({
    dirty: hasUnsavedChanges,          // Ref<boolean> | boolean
    pending: isSaving,                 // Ref<boolean> | boolean
    commit: async () => await save(),  // awaited while pending
    confirm: async () => await askUser()
});
```

| Option | Type | Description |
|---|---|---|
| `dirty` | `Ref<boolean> \| boolean` | Whether there are unsaved changes. Default `false`. |
| `pending` | `Ref<boolean> \| boolean` | Whether work is in flight. Default `false`. |
| `commit` | `() => Promise<void>` | Awaited before closing while `pending` is true. **If it rejects, the close is cancelled.** |
| `confirm` | `(ctx: {entryId, reason}) => boolean \| Promise<boolean>` | Asked when `dirty` is true. Return `false` to cancel. |
| `message` | `string` | Message for the fallback confirm. |

Returns `{entryId, dirty, pending}`.

Behavior notes:

- If `dirty` is false and nothing is pending, the close proceeds without asking.
- If `confirm` is omitted but `dirty` is true, Layerge falls back to `window.confirm(message)`. **Provide `confirm` if you want your own UI** — this fallback exists only so that a guard is never silently skipped.
- While `dirty` or `pending` is true, a `beforeunload` guard is activated.
- Guards from multiple entries are evaluated with AND logic; any `false` cancels.
- An exception thrown inside the guard does **not** block the close.

### `useLayergeLink(to, computeAttrs?, hooks?)`

The headless form of `<LayergeLink>`, for building your own link component.

```js
const {bindings, handlers} = useLayergeLink(() => import('./Settings.vue'));
// template: <button v-bind="bindings" @click="handlers.open">Settings</button>
```

Returns `{bindings, handler, handlers}` — `handler` and `handlers` are the same object, kept for compatibility. Each exposes `open` / `push` / `replace`.

The optional `hooks` argument accepts `beforeOpen`, `opened`, `entered`, `openFailed`, `beforeClose`, `closed`, `closeFailed` and `settled`. Each receives the `entryId`; you never supply it yourself.

**`opened` and `entered` are not the same moment**, and the difference matters:

| Hook | Fires |
|---|---|
| `opened` | After the open call, on the next tick — rendering has progressed. |
| `entered` | When the entry reaches `phase: 'active'` — the overlay can be treated as a settled DOM element. |

If you need to focus something inside the overlay, use `entered`.

> `useLayergeLink()` works without any `provide` on your side. It uses the injected store when one is available and falls back to `router.$layerge` otherwise.

## Components

### `<LayergeView />`

The overlay root. Mount it **once** at the app root. It is viewport-based (`position: fixed`); container-scoped overlays are out of scope.

### `<LayergeTransition>`

Wrap presenter UI with this instead of `<Transition>` to get enter/leave notifications without calling `notify*Done` by hand. It merges your hooks safely: `after-enter` runs internal→user, `after-leave` runs user→internal.

If you do not need animation you can omit it entirely; Layerge then auto-completes enter/leave so the overlay cannot get stuck.

### `<LayergeLink>`

A minimal `RouterLink`-compatible link that triggers a presenter.

| Prop | Type | Default | Description |
|---|---|---|---|
| `presenter` | `string` | *(required)* | Presenter key to invoke. |
| `action` | `'push' \| 'replace' \| 'open'` | `'push'` | Which presenter method to call. |
| `to` | `RouteLocationRaw` | — | Route mode. Mutually exclusive with `component`. |
| `component` | `Component` | — | Component mode. Mutually exclusive with `to`. |
| `url` | `string \| RouteLocationRaw` | — | For `push` / `replace` only; warns and is ignored on `open`. |
| `custom` | `boolean` | `false` | Renders no `<a>`; exposes `navigate` and `handler` via slot props. |
| `prevent` | `boolean` | `true` | Whether to `preventDefault()` on click. |
| `disabled` | `boolean` | `false` | Renders but does nothing. |

Notes:

- `presenter` is **required**. Passing both `to` and `component` warns and uses `to`; passing neither warns and makes the link a no-op.
- With `prevent: false` in route mode, Ctrl/Cmd-click and non-left-click fall through to normal browser link behavior.
- In route mode with `url`, the link navigates to `url` first and then opens `to` view-only, so `to` is rendered while the address bar shows `url`.
- `Enter` and `Space` activate the link.
- **Forward restoration applies to `push` only.** An overlay opened with `action="push"` is restored when the user goes Back and then Forward. `replace` and `open` are deliberately excluded, because restoring them has no unambiguous meaning.

## display

`display` is the only option that controls how a presenter renders its entries. It takes one of three values, and a presenter that does not set its own inherits the root `display` (which itself defaults to `top`).

| display | meaning |
|---|---|
| `top` | Only the top entry is rendered (lightweight). |
| `stack` | Entries are stacked for close and history, but lower layers are not rendered. |
| `stack+cache` | **Visible stacking + freeze** — lower layers stay mounted and can remain visible. |

Pick `stack+cache` when a lower layer must keep its state and stay on screen (a card stack); `top` otherwise.

## Constraints

- `open()` does **not** navigate.
    - If `target` is `RouteLocationRaw`, Layerge only guarantees an existence check (matched>0).
        - It is view-only (no guards / navigation lifecycle).
        - If you need full route semantics in an overlay, use `createMemoryHistory()` (Layerge does not implement it).
    - If `target` is a `Component` / `loader`, it overlays on the current route without changing the URL.
- `push/replace(Component|loader, {url})` navigates to `url` but renders the provided component.
    - This is useful for back/forward integration.
    - Refresh restoration depends on your router setup (e.g. catch-all route).
- `open(..., {url})` is ignored.
    - Dev only: warns when `debug:true`.
    - Prod: silently ignored.

## Environment support

What Layerge guarantees depends on the environment. **This matrix is part of the contract.**

| Environment | Contract |
|---|---|
| Server-side rendering (in progress) | **Out of scope.** Calls become a no-op with a development warning. Layerge must not crash, but nothing is rendered. |
| After hydration | **Guaranteed.** |
| Concurrency in one tab | **Guaranteed** — latest wins. See [Async consistency](#async-consistency). |
| Multiple tabs | **Undefined.** Layerge does not coordinate across tabs and must not crash; each tab's state is its own. |
| Router differences | **Partially guaranteed.** Layerge does not absorb behavioral differences between router versions; an unsupported case converges as an observable outcome rather than an exception. |
| Browser-level events (back/forward, reload) | Integrated through the router. Layerge owns no UX of its own. |

## Responsibility boundary

Layerge intentionally keeps a strict boundary so that apps can freely design UI/UX.

Layerge **does not** decide:

- Z-order, z-index, stacking visuals
- CSS / animations / layout
- Trigger capture / invoker model
- `aria-expanded` / `aria-controls` automation
- Custom `<RouterLink>` / `<LayergeLink>` behavior

Layerge **does** guarantee:

- Stable presenter navigation (`open/push/replace`)
- Leaving DOM retention (so leave animations can always run)
- Presenter bindings via `usePresenterBindings()`
- Transition notifications via `<LayergeTransition>`

## Internal members

Layerge's runtime objects carry members that the published type definitions do not
declare. This applies to `router.$layerge`, to the presenter entries inside it, to the
presenter definitions in `$layerge.presenters`, and to the handle returned by `open` /
`push` / `replace`.

They are there because the published types are generated from the sources with
`stripInternal`: the type definitions are filtered, the runtime objects are not. What
you get back at runtime is the same object Layerge uses internally.

**The published type definitions are the contract.** If a member does not appear in
them, it is internal — whether or not its name starts with an underscore.

You are welcome to read these members while debugging. Inspecting `$layerge.stack` in
devtools to see why an overlay did not close is a reasonable thing to do, and Layerge
will not stop you. What is not supported is depending on them from application code:
reading them in a computed, writing to them, or calling them. They can change name,
change meaning, or disappear in any release, including a patch release, and such a
change will not be described as breaking.

If you find yourself needing an internal member to do something real, that is worth
reporting as a gap in the public API rather than working around.

## Advanced

- Mapper / adapter patterns are available for people who want full control.
- They are **not required** and should not be the default path in docs or examples.

## Not provided

Layerge does not ship these, and does not plan to:

- **Generic transition-end helpers** (`transitionend` / `animationend`). Use `<LayergeTransition>`, or wire the events yourself.
- **Accessibility automation** (`aria-expanded` / `aria-controls`). The correct values depend on your markup.
- **UI of any kind** — z-index, CSS, animation, confirm dialogs. See [Responsibility boundary](#responsibility-boundary).

## Closing semantics

Layerge has two ways to leave presenter mode:

- **`closeTop/closeAll`**: closes presenter entries (this is what an overlay "×" should use).
- **`exit()`**: force-exits presenter mode (advanced). Use it to recover from unexpected states.

When closing the top entry, URL restoration depends on how that entry was opened:

- `open(...)`: URL is unchanged.
- `push(...)`: behaves like browser back.
- `replace(..., {url})`: restores a saved `returnTo` via `router.replace(returnTo)`.
  - Default `returnTo` is `from.fullPath`.

**Important:** `replace(...)` refers to URL semantics only. Layerge still **stacks** a new presenter entry (it does not overwrite the previous entry).

Notes:

- To close UI without URL restoration (advanced), pass `{restoreUrl:false}`.

### Async consistency

Layerge is designed around a simple rule:

> **Latest wins.** If a newer presenter navigation starts while an older one is still pending (e.g. due to guard delays), the older one is considered **superseded**.

What Layerge guarantees:

- Guard/loader delays or rapid operations do not roll back Layerge state.
- Cancel/failure does not commit.
- Only the navigation that actually reaches the expected route is committed (stale commit prevention).
- Browser history typically reflects **only committed navigations**.
    - When pushes race, you usually get `home → last` (not `home → a → b → ...`).

Race example (expected):

```js
// A is delayed by a guard. B starts immediately and wins.
router.modal.push('/page-a?delay=1200');
router.modal.push('/page-b');

// Result: presenter shows Page B, URL is /page-b.
// The delayed /page-a navigation is superseded and does not commit.
```

If you need `A → B → C` to reliably build a stack, see the sequential pattern below.

## Best Practices

- Prefer `() => import('...')` loader for heavy overlays.
- If you want browser back/forward to close overlays, use `push/replace(..., {url})`.
    - Without `url`, `push/replace(Component|loader)` behaves like an overlay on the current URL.
- Use `open()` for overlays that must never touch the URL.

### Example: view-only overlay (login/settings)

```js
// login (lightweight)
router.modal.open(LoginForm);

// settings (lazy-loaded)
router.modal.open(() => import('./overlays/SettingsForm.vue'));
```

If you want the browser back button to close an overlay, use `push/replace(..., {url})` instead.

### url refresh and routing strategies

`url` updates the address bar for back/forward integration, but the rendered overlay (Component/loader) is stored **in memory**.

This means:

- If the user refreshes the page on such a URL, Vue Router will render whatever your route table maps to that path.
- If you have no matching route (and no catch-all), the app can land on a 404.

Common strategies:

1) Add a catch-all route so the URL never hard-404s:

```js
const routes = [
    // ...your routes
    {path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundPage}
];
```

2) Create dedicated "bridge" routes for specific fake paths.
   - Example: `/modal/settings` route that opens the modal on mount (and optionally redirects).
   - This lets you intentionally control what happens after refresh on that URL.

Minimal example:

```js
// routes
{path: '/modal/settings', component: ModalSettingsBridge}
```

```vue
<!-- ModalSettingsBridge.vue -->
<script setup>
import {onMounted} from 'vue';
import {useRouter} from 'vue-router';

const router = useRouter();

onMounted(() => {
    // Re-open the modal when landing on /modal/settings (e.g. after refresh)
    router.modal.open(() => import('./presenters/SettingsModal.vue'));
});
</script>

<template>
    <div />
</template>
```

### Case Study: Modal overlay with URL integration

```js
// URL is updated to /modal/settings, but the view is rendered from SettingsModal.vue
router.modal.push(() => import('./presenters/SettingsModal.vue'), {url: '/modal/settings'});
```


Behavior notes:

- `push(..., {url})` adds a history entry. Browser back typically closes the overlay (demo + E2E cover this).
- `replace(..., {url})` replaces the current history entry.
  - If you navigated inside the SPA, back returns to the previous entry (before the replaced one).
  - If the replaced entry was the first entry (e.g. direct page load), back may leave the app — this is normal browser behavior.
- The URL can 404 on refresh if you don't have a catch-all route. This is allowed by design.



### Case Study: Stacking multiple pages (naive vs sequential)

Layerge is designed so that **the latest operation wins**. If you issue multiple `push()` calls back-to-back (while earlier navigations are still pending due to guards/loader delays), earlier navigations may be **canceled** and will not be committed.

This means a "naive" loop like this will typically end up committing **only the last** navigation:

```js
// Naive: earlier pushes can be canceled; the last one usually wins.
router.stackCard.push('/page-a');
router.stackCard.push('/page-b');
router.stackCard.push('/page-c');
router.stackCard.push('/page-d');
router.stackCard.push('/page-e');
```

If you actually want to build a stack (A → B → C → ...), run pushes sequentially (await each one) so the previous navigation is committed before pushing the next one.

Below is a minimal helper using Vue `watchEffect()`:

```js
import {watchEffect} from 'vue';
import {useLayerge} from 'layerge';

const {layerge} = useLayerge();

/**
 * Wait until the current presenter stack reaches a given depth.
 * @param {number} depth - Target depth.
 * @returns {Promise<void>}
 */
const waitForDepth = (depth) => {
    return new Promise((resolve) => {
        /** @type {(() => void)|null} */
        let stop = null;

        stop = watchEffect(() => {
            if (layerge.stack.length >= depth) {
                if (stop) {
                    stop();
                }
                resolve();
            }
        });
    });
};

router.stackCard.push('/page-a');
await waitForDepth(1);

router.stackCard.push('/page-b');
await waitForDepth(2);

router.stackCard.push('/page-c');
await waitForDepth(3);

// ...and so on
```

Notes:

- Canceled navigations are intentionally not preserved in history; you usually get `home → last` (not `home → a → b → ...`) when pushes race.
- If you need an atomic API for restoring a stack from state, consider building a small utility on top of the sequential pattern above (and share it as a case study).


## Development

```bash
pnpm install
pnpm demo:dev
```

## Tests

Logic tests (Vitest):

```bash
pnpm test
```

E2E (Playwright):

```bash
sudo pnpm e2e:install-deps
pnpm e2e:install
pnpm test:e2e
```

If you see a Playwright host validation warning about missing libraries on Linux,
install system dependencies first:

```bash
sudo pnpm exec playwright install-deps chromium
```

## Debugging

### `debug: true`

Enable `debug: true` on `createLayergeRouter` to see afterEach logs:

```text
[Layerge][afterEach] { to:"/page-a", mode:"presenter", depth:1 }
```

### Decision traces (development only)

When an operation appears to do nothing, Layerge can explain why. It records a structured trace of the decisions that led to the outcome — **not** an exception stack.

Traces are **off by default** and are never emitted in production builds. Opt in through any of these:

```js
globalThis.__LAYERGE_DECISION_TRACE_LEVEL = 'on-unexpected';
// or process.env.LAYERGE_DECISION_TRACE_LEVEL
// or import.meta.env.VITE_LAYERGE_DECISION_TRACE_LEVEL
```

| Level | Emits |
|---|---|
| `off` | Nothing. The default. |
| `on-failure` | Only `failed` outcomes. |
| `on-unexpected` | Anything that is not a plain success — aborted, superseded, failed. **A good default while developing.** |
| `verbose` | Every event. Development only. |

Every operation carries a `traceId`, so a one-line outcome log can be correlated with its trace. Dump the collected traces with:

```js
globalThis.__layergeDumpDecisionTraces({pretty: true});
```

Traces are bounded (a ring buffer) so a long session cannot grow without limit. URLs, queries and hashes are sanitized before being recorded.

## Demo

```bash
cd demo
pnpm i
pnpm dev
```

The demo is the fastest way to validate **history integration**, **async consistency (latest-wins)**, and **URL integration** (bridge routes).

### Status panel (Home: `/`)

At the top of Home you can always verify:

- `home-url`: current URL
- `home-mode`: `page` / `presenter`
- `home-depth`: 0, 1, 2...
- `last-action` / `last-result`: updated via `navLog` (a single global `router.afterEach`)

### Try-it checklist (new/important flows)

#### 1) `open()` flows (Home)

A. **`modal.open(Component)`** (`data-testid="modal-open-component"`)

- Expected:
  - URL stays `/`
  - Overlay shows **Open Content**
  - `home-mode=presenter`, `home-depth=1`
- Close:
  - Click **Close** (`data-testid="overlay-close"`)
  - Returns to `home-mode=page`, `home-depth=0`

B. **`modal.open('/page-a') (should throw)`** (`data-testid="modal-open-mismatch"`)

- Why it throws:
  - `open()` does **not** navigate. It is view-only (URL unchanged).
- Expected:
  - UI shows an error in `last-result` (e.g. `open() does not navigate...`)
  - Screen and URL do not change (`home-mode=page`, `home-depth=0`)

#### 2) Close boundary (StackCard + Modal)

This flow is meant to verify **closeTop/closeAll behavior** when you have multiple presenters in the stack.

1. Open **`/modal/cache-demo`** (bridge entry point)
   - Expected: StackCard presenter opens and ends on `/cache-state`.
2. On `/cache-state`, click **`modal.open(Component) on top`** (`data-testid="cache-open-modal"`)

- Expected after step 2:
  - Modal is shown on top.
  - **Note:** “Visible stacking” (rendering lower layers) is enabled only when the *top* presenter is configured with `display: 'stack+cache'`.
    Since `modal` is not (`display: 'top'`), the StackCard layer will be **hidden while the modal is on top** (it is still kept in the internal stack).

Close order:

- First: modal **Close** (`data-testid="overlay-close"`)
  - Expected: modal closes and `/cache-state` (StackCard) becomes visible again.
- Second: StackCard **Close** (`data-testid="stackcard-close"`)
  - Expected: presenter disappears (`home-depth=0` / page mode).
  - URL stays `/cache-state` (this flow uses `stackCard.replace('/cache-state')`).

#### 3) `replace(..., {url})` back behavior (Home → Page A)

1. From Home, click `router.push('/page-a')` (`data-testid="nav-to-page-a"`)
2. On Page A, click `modal.replace(Component, { url: '/no-route/replace' })` (`data-testid="modal-replace-url"`)

- Expected:
  - URL becomes `/no-route/replace`
  - Overlay shows **Modal Open Content**
  - Browser back returns to `/` (NOT `/page-a`) because `replace()` overwrote the `/page-a` history entry.

### Related E2E specs

- `e2e/modal_open_component.spec.js`
- `e2e/modal_open_mismatch.spec.js`
- `e2e/stackcard_then_modal_close.spec.js`
- `e2e/modal_replace_url.spec.js`

## Acceptance Criteria

1. `router.modal.push('/page-a')` => `mode:'presenter' depth:1`
2. Repeated `push` increases depth
3. Browser back returns `/page-e → d → c → b → a` while staying `mode:'presenter'`
4. Returning to `/` results in `mode:'page' depth:0`
5. With `display: 'stack+cache'`, lower layers are visible (stacking)
6. Non-top layers are not interactable (pointer-events / inert / aria-hidden)
7. Background is not unnecessarily unmounted/remounted (freeze)
8. `router.modal.open(Component)` shows overlay without changing the URL
9. `router.modal.open(RouteLocationRaw)` validates that the route exists (matched>0). It is view-only (URL unchanged) and may warn in dev when URL/content can mismatch.
10. `replace(..., {url})` overwrites the current history entry (back target changes accordingly)
