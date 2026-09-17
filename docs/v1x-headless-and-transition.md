# Layerge v1.x: Headless化とTransition保証（凍結仕様）

このドキュメントは、Layerge v1.x フェーズにおける **仕様・責務境界**を固定するための「唯一の参照元」です。
実装・テスト・レビューは、原則として本書との差分で議論します。

---

## 目的

- 仕様・責務境界を崩さずに、**LayergeView の headless 化**と **Presenter 側 Transition 保証**を実現する。
- 実装漏れで壊れやすい箇所（notify / leave 保持 / stackVisible）を、**構造とテストで固定**する。
- v2（invoker / link 拡張）に持ち越す項目を明確化し、v1 でやらないことを明記する。

---

## 1. 確定仕様（凍結点）

この章は **実装中に揺らがせない**。
変更する場合は、まず本ドキュメントを更新し、その後 PR で合意を取る。

### 1-1. 公開 State（v1 最小セット） = EntryContext

公開 State は `EntryContext` と呼び、Presenter 側で inject して参照できる。

- `entryId: string`
- `phase: 'enter' | 'active' | 'leave'`
- `index: number`（0 始まり）
- `depth: number`
- `isTop: boolean`

補足:

- `zIndex` は提供しない（`index` / `depth` / `isTop` から利用者が計算する）
- `mode` / `reason` / `stackVisible` は提供しない（迷いを増やすため v1 から除外）

### 1-2. Transition 責務

- Presenter が `<Transition>` を持つ（アニメーションは Presenter 責務）
- enter / appear / leave を **すべて保証**する
- 利用者が `notifyEnterDone` / `notifyLeaveDone` を手書きしない

そのため、Layerge は **`<LayergeTransition>`** を提供する（B’案）。

- `entryId` / `phase` は props で渡さない（inject で取得する）

### 1-3. hook 合成順序（超重要）

`<LayergeTransition>` は、内部 hook とユーザー hook を合成し、上書きして壊さない。

- `after-enter`: **internal notify → user hook**
- `after-leave`: **user hook → internal notify**

ユーザー hook が例外を投げても internal notify は実行される（`try` / `finally` 推奨）。

### 1-4. 描画対象ルール（stackVisible × leave）

描画対象は以下の合成で決まる。

- 描画対象 = 「表示中（stack）」＋「leave 中（leaving）」
- `stackVisible=false`: **top + leaving**
- `stackVisible=true`: **stack 全段 + leaving**

補足:

- Z 順や CSS は Presenter 責務（Layerge は決めない）
- leaving は「存在する限り必ず描画対象」に入る

### 1-5. mapper

- v1 では主役にしない（advanced 例として紹介するだけ）
- 必須機能にしない

### 1-6. v1 でやらない（v2 へ）

v1 では以下を実装しない。

- invoker モデル（trigger 捕捉、aria-expanded / controls 自動化）
- router-link 拡張 / layerge-link 提供
- CSS `transitionend` / `animationend` を直接扱う汎用ヘルパ

---

## 2. 実装における補足（変更の自由度）

本ドキュメントが固定するのは「外部に見える仕様」と「責務境界」である。

- どのファイルにどう差し込むか
- store の内部構造（配列 / Map など）

といった **実装詳細**は、既存リポジトリ構造と保守性に合わせて決めてよい。
