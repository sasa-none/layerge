# Layerge v2 設計凍結プラン（P0/P1）

このドキュメントは、Layerge v2 の P0 / P1 で**凍結した仕様**を文章として固定し、
実装者が迷わず PR を積み上げられるようにするための「唯一の正」です。

- ソースコード生成は本ドキュメントの目的ではありません（実装は PRv2-1 以降）。
- v2 の主目的は **利用者の実装コストを減らす**ことです。
- Layerge は UI/デザイン/A11y を **強制保証しません**（必要な人が任意で使える部品として提供します）。

## 関連ドキュメント

- **v2 利用ガイド（導入例 / よくある落とし穴）**: `docs/v2/usage.md`

---

## 1. v2 のスコープ

### ✅ In Scope（v2で実現する）

- **Invokerモデル（P0）**
  - 「開く起点（trigger DOM）」と「entry（entryId）」を紐づける最小基盤
  - A11y を保証しない（必要な人が使える）
- **useLayergeLink（P0）**
  - カスタムコンポーネントでも RouterLink 的に導線を構築できる
  - hooks で `opened/entered` を観測できる（Promise は不要）
- **LayergeLink（P1）**
  - RouterLink 互換の導線（`custom` slot を含む）
  - `prevent` / `disabled` を含む最小 Props

### ❌ Out of Scope（v2ではやらない）

- keepMounted / 事前マウントモード（v3以降検討）
- fakePath を LayergeLink が面倒見る
- component props を LayergeLink が受ける
- disabled通知・アラート連携の標準化（分岐は利用者が行う）
- transitionend/animationend の汎用ヘルパ（必要になったら検討）
- Layerge が aria やフォーカス制御を強制保証する方向

---

## 2. P0 仕様：Invoker + useLayergeLink

### 2-1. Invoker の定義（最小コア）

Invoker は「アクセシビリティ保証機構」ではありません。
**entry と trigger DOM を結びつける接続点**として提供します。

#### ✅ Invoker が保持するデータ（凍結）

- `entryId: string`
- `el: HTMLElement`

> それ以外（aria情報、expanded状態、controls、reason等）は invoker が持ちません。

#### ✅ 破棄（凍結）

- entry が **leave 完了で完全破棄されるタイミング**で invoker も自動破棄する
  - Layerge が invoker を確実に片付ける

---

### 2-2. entryId の確定タイミング（凍結）

- `entryId` は **クリック時（open 発火時）確定で問題ない**
- Reservation（予約ID）は不要（採用しない）

---

### 2-3. useLayergeLink API（凍結）

#### ✅ シグネチャ（凍結）

`useLayergeLink(to, computeAttrs, hooks)`

- `to`: `RouteLocationRaw | Component` 相当（Link と同等の入口を想定）
- `computeAttrs`: attrs 算出関数（任意。a11y属性等もここで付与可能）
- `hooks`: open/close ライフサイクル通知（通知型）

#### ✅ return（凍結）

- `bindings`（computed）
  - `ref`（DOM捕捉用）
  - `computeAttrs()` の結果を merge

> v2 方針として、useLayergeLink は UI/A11y を保証しないため、イベントハンドラ（onClick/onKeydown 等）は返しません。
> 利用者は `@click` / `v-on` で `handler.push/replace/open` を明示的に紐づけます。

- `handler / handlers`
  - `open/push/replace`（必要最小限）
  - **Promise を返さない（void）**

> a11y 属性の自動付与は強制しません。必要な人は `computeAttrs` で載せます。

---

### 2-4. hooks（通知型）仕様（凍結）

#### ✅ hooks 一覧（凍結）

- `beforeOpen`
- `opened`
- `entered`
- `openFailed(error)`
- `beforeClose`
- `closed`
- `closeFailed(error)`
- `settled(result)`（成功/失敗どちらでも必ず到達する出口）

#### ✅ hooks の意味（凍結）

- `opened`
  - **beforeOpen → open → nextTick の後**
  - 「開く処理が走り、描画が進んだ直後」の観測点
- `entered`
  - entry が `phase='active'` に到達した瞬間
  - 「DOMとして扱える状態」を強めに保証する観測点（v1.x の phase 状態機械に一致）

#### ✅ 安定性ルール（凍結）

- hooks は **通知型**（キャンセル/await は v2 では扱わない）
- hooks 例外で Layerge の挙動を壊さない（try/catch で保護）
- 成功/失敗に関わらず `settled` に収束すること

---

## 3. P1 仕様：LayergeLink

### 3-1. LayergeLink の責務（凍結）

LayergeLink は RouterLink 相当として **“to による導線” を提供するだけ**です。

- fakePath / component / 高度制御は Link の責務外
- 高度なことをしたい場合は `$layerge.(push|replace|open)` を使う（上級者ルート）

---

### 3-2. Props（凍結）

- `presenter`（required）
- `action`（default: `"push"`）
- `to`（required / RouteLocationRaw）
- `custom`（default: `false`）
- `prevent`（default: `true`）
- `disabled`（default: `false`）

> `component` props は P1 では採用しません。
> `fakePath` も P1 では面倒見ません。

---

### 3-3. prevent の挙動（凍結）

- `prevent=true`
  - 常に `event.preventDefault()` → Layerge 導線で開く
- `prevent=false`
  - metaKey / ctrlKey の場合のみ prevent しない（通常リンク挙動）
  - 通常クリックは prevent して Layerge 導線で開く

---

### 3-4. custom slot（凍結）

`custom=true` の場合、slot には以下を渡します。

#### ✅ `navigate(event?)`

- `action` 指定メソッドを呼び出す（固定導線）

#### ✅ `handler`

- `to` に束縛された `push/replace/open` メソッド群
- いずれも **引数は `event?` のみ**
  - invoker は `event.currentTarget` で内部補完できる

#### ✅ 高度用途（凍結）

- custom slot 内で「別のもの」を開きたい場合は `$layerge` を利用する
  - handler で to を上書きしない

---

### 3-5. disabled（凍結）

- `disabled=true` の場合は **起動しない（何もしない）**
- disabled 時に別 Presenter を出す、理由を表示する等は **利用者側で分岐**する（v-if/custom 等）

---

## 4. PR 計画（凍結）

- **PRv2-0：設計Docs凍結**
  - 本ドキュメントを追加する
- **PRv2-1：Invokerコア**
  - entryId ↔ el の管理基盤、破棄まで保証
- **PRv2-2：useLayergeLink**
  - カスタム導線の正規ルートを提供
- **PRv2-3：LayergeLink**
  - RouterLink 互換の最小 Link 導線
- **PRv2-4：E2E**
  - v2 の価値が壊れないよう凍結テスト

---

## 5. 実装者向け注意事項（v1.x思想を壊さない）

- 公開 State（EntryContext）を増やさない
  - mode/reason/stackVisible/zIndex 等を追加しない
- leaving は常に描画対象、phase 状態機械を崩さない
- Transition hook 合成順序を崩さない
- stale notify を無害化している前提を壊さない
- “便利” のために Layerge が UI へ寄りすぎない（責務境界維持）
