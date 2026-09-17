# Layerge v2 利用ガイド（useLayergeLink / LayergeLink）

このドキュメントは Layerge v2 の **導線（Link）系API** を、
実装者が迷わず導入できるようにまとめたガイドです。

- v2 は **UI/A11y の強制保証をしません**（必要な人が任意で使える提供）。
- v2 は **Promise を返さない通知型 hooks** を採用します。

---

## 1. まずどれを使う？（選び方）

### ✅ 迷ったら `LayergeLink`（RouterLink互換）

- `to` でルーティング先を指定するだけ
- `prevent/disabled/custom slot` が使える

### ✅ カスタムボタン等で RouterLink 的にしたいなら `useLayergeLink`

- `<button>` / `<div>` / カスタムUIでも導線を作れる
- entryId ↔ trigger DOM の接続（Invoker）も自動で扱える
- hooks で opened/entered/closed/settled を観測できる

---

## 2. LayergeLink（P1）

### 2-1. 最小例（push）

```vue
<LayergeLink presenter="modal" action="push" :to="{ path: '/page-a' }">
  open Page A
</LayergeLink>
```

### 2-1-1. Forward 復元（push のみ）

`action="push"` で起動した Presenter は、
ブラウザの **Back で閉じた後に Forward で復元（再表示）** されます。

- ✅ 対象: `push`
- ❌ 非対象: `replace` / `open`（履歴復元の意味が曖昧になるため）

### 2-2. `prevent` の挙動

- `prevent=true`（デフォルト）
  - 常に `event.preventDefault()`
  - **常に Layerge 導線で開く**

- `prevent=false`
  - **通常クリック**は prevent して Layerge 導線
  - **ctrl/meta クリック**だけ prevent しない（ブラウザ標準挙動）

> 新規タブ等を許可したい場合は `prevent=false` を使います。

### 2-3. `custom slot` の使い方

```vue
<LayergeLink presenter="modal" action="push" :to="{ path: '/page-a' }" custom>
  <template #default="{ navigate, handler }">
    <button type="button" @click="navigate">open by navigate()</button>
    <button type="button" @click="handler.replace">replace</button>
  </template>
</LayergeLink>
```

- `navigate(event?)` は `action` に従って push/replace/open を呼びます
- `handler` は `to` に束縛された `push/replace/open` です（引数は event? のみ）

### 2-4. `disabled` の考え方

`disabled=true` は **何もしない**（no-op）です。

- 「理由を表示する」
- 「別のPresenterを開く」

などの分岐は **利用者側で行います**（v2では標準化しません）。

---

## 3. useLayergeLink（P0）

### 3-1. 最小例（button）

```vue
<script setup>
import { useLayergeLink } from 'layerge';

const link = useLayergeLink(
  { path: '/page-a' },
  () => ({ role: 'button', tabIndex: 0 }),
  {
    beforeOpen: () => console.log('beforeOpen'),
    opened: ({ entryId }) => console.log('opened', entryId),
    entered: ({ entryId }) => console.log('entered', entryId),
    settled: (r) => console.log('settled', r),
  }
);
</script>

<template>
  <button
    type="button"
    v-bind="link.bindings"
    @click="link.handler.push"
  >
    open
  </button>
</template>
```

> **重要**: useLayergeLink はイベントハンドラ（onClick/onKeydown 等）を返しません。
> `v-bind="link.bindings"` で attrs/ref を適用し、`@click` で `link.handler.*` を明示的に接続してください。

### 3-2. hooks の意味（opened / entered）

- `opened`
  - `beforeOpen → open実行 → nextTick後`
  - 「描画が進んだ直後」の観測点

- `entered`
  - entry が `phase='active'` に到達した瞬間
  - 「DOMとして扱える状態」に寄った観測点

### 3-3. hooks の entryId について

- `opened/entered/beforeClose/closed` には `entryId` が渡されます
- 利用者が entryId を指定する必要はありません

### 3-4. provide は必要？（重要）

`useLayergeLink` は **原則 provide 不要**で動作します。

- `inject(LayergeKey)` が取れる場合はそれを使用
- 取れない場合は `router.$layerge` をフォールバックに使用

> demo や軽量構成でも動作することを優先しています。

---

## 4. open(RouteLocationRaw) の warn について

`modal.open({ path: '/page-a' })` を使うと以下のような warn が表示されることがあります。

- `open(RouteLocationRaw)` は **view-only**
- **URL 遷移しない**
- **ガードも実行しない**

そのため **URL / content が不整合になり得る**ことを警告しています。

> Overlay用途は `open(Component/loader)` を推奨します。
