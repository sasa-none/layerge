# TypeScript 全面移行 仕様書

最終更新: 2026-09-17
状態: **確定（実装未着手）**

このドキュメントは、Layerge のソースを TypeScript へ全面移行するにあたっての**決定事項と、その判断理由**を記録します。
実装は Claude Code 側で行います。**本書が実装との契約です。**

> 実装中に本書と矛盾する事態が生じた場合、判断を実装側で下さずに、本書を更新してください。
> 本書で曖昧な箇所を見つけた場合、それは文脈が失われた箇所です。実装を止めて確認してください。

---

## 1. 前提

### 1-1. 現状

| 項目 | 現状 |
|---|---|
| ソース | JavaScript + JSDoc |
| 型定義 | 手書きの `index.d.ts` / `index.d.cts`（**差分なしの完全同一ファイル**） |
| `tsconfig.json` | 段階 0 で作成済み（`allowJs: true` / `noEmit: true`） |
| ビルド | Vite lib mode（`es` / `cjs` の 2 形式） |
| ESLint | 段階 0 で `typescript-eslint` を `layerge/**/*.ts` に限定して追加済み |

#### TypeScript のバージョン固定（2026-09-18）

**TypeScript は `6.0.3` に固定されています。最新の `7.x` は使えません。**

`typescript-eslint@8.70.0` の peer 制約が `typescript >=4.8.4 <6.1.0` であり、3 パッケージ（`typescript` / `vue-tsc` / `typescript-eslint`）を両立させる唯一の組み合わせがこれだからです。

**この制約を知らずに `typescript` を上げると peer が壊れます。**上げる場合は `typescript-eslint` 側が新しい範囲を受け付けるようになってから、3 つ揃えて上げてください。

### 1-2. 移行対象の規模

| 対象 | 行数 |
|---|---:|
| `layerge/**/*.js` 合計 | 4,401 |
| うち `router/createLayergeRouter.js` | **2,731（全体の 62%）** |
| `layerge/**/*.vue` 合計 | 870 |
| **合計** | **約 5,300** |

### 1-3. 安全網

| 種別 | 規模 |
|---|---|
| ロジックテスト（Vitest） | 768 行 |
| E2E（Playwright） | **43 スペック** |
| 消費側検証 | `consumer-vue-router-4` / `consumer-vue-router-5` |

**この E2E 43 本が、本移行を安全に成立させている根拠です。**公開挙動が固定されているため、リファクタリングとして扱えます。
E2E が通らない状態で次の段階へ進んではいけません。

---

## 2. 決定事項

### 2-1. 移行は npm 公開の**前**に完了させる

**決定:** `1.0.0` を公開する前に TypeScript 移行を完了させる。

**理由:** 型定義が厳密になることで、利用者側に新たな型エラーが出る可能性があります。公開後に行うと、それが「壊れた」と受け取られます。未公開のうちに済ませれば、その問題自体が発生しません。

**影響:** ROADMAP の優先度 A（公開前必須）に本項目が加わります。公開までの期間は伸びます。

### 2-2. 内側から段階的に移行する

**決定:** 依存の少ない層から順に `.ts` 化する。一括移行は行わない。

**理由:** `createLayergeRouter.js` が単体で 2,731 行あり、全体の 62% を占めます。ここを他と同時に動かすと、**差分がレビュー不能な大きさになり、問題が出たときの切り分けもできません。**段階的であれば各段階でテストが通る状態を保て、途中で中断しても壊れません。

**影響:** 移行期間中は `.ts` と `.js` が混在します。`tsconfig.json` の `allowJs: true` で許容します。

### 2-3. 型定義はビルド生成に一本化する

**決定:** `index.d.ts` / `index.d.cts` の手書き運用を廃止し、TypeScript ソースから生成する。

**理由:** 現在の 2 ファイルは差分なしの完全同一であり、手書きで二重管理されています。手書きである以上、実装とのズレは検出されません。生成に切り替えれば**ズレが原理的に起きなくなります。**

**影響:** `package.json` の `exports` マップ（`import` → `.d.ts` / `require` → `.d.cts`）は維持します。2 形式で型の内容に差はないため、生成した `.d.ts` を `.d.cts` として複製する形で構いません。`files` フィールドの見直しが必要です。

---

## 3. 却下した代替案

判断の経緯を残します。以下は**検討したうえで却下**したものです。将来これらを再提案する場合は、ここに書かれた却下理由を覆す必要があります。

### 3-1. JSDoc から `.d.ts` を自動生成する方式（TS 化しない）

`tsc --allowJs --declaration --emitDeclarationOnly` で、ソースを JS のまま型定義だけ生成する案。

**却下理由:** 二重管理は解消できますが、**ソース内での型安全性は得られません。**JSDoc の型は実装を拘束しないため、実装側のバグは検出されないままです。既存の JSDoc 規約が活きるという利点はありましたが、型の恩恵を型定義の出力にしか使えないのは中途半端と判断しました。

### 3-2. 手書き `.d.ts` を維持し、型テストで守る方式

`tsd` や `vitest --typecheck` で実装と型定義のズレを検出する案。

**却下理由:** 変更が最小で済む一方、**二重管理そのものは残ります。**テストは書き忘れたケースを検出できません。根本解決になりません。

### 3-3. 一括移行

**却下理由:** 2-2 に記載のとおり、差分がレビュー不能になり、切り分けも不可能になるため。

---

## 4. 移行手順

各段階の完了条件は共通して次の **4 つすべて**です。これを満たさずに次へ進まないでください。

1. `pnpm typecheck`（`vue-tsc --noEmit`）
2. `pnpm lint:check`
3. `pnpm test`
4. E2E 43 スペックが全て緑

#### E2E が緑にならない場合の唯一の例外（2026-09-18 決定）

**次の 3 条件をすべて満たす場合に限り、E2E が緑でなくてもコミットしてよい**ものとします。

1. 変更が**コメント・ドキュメントのみ**である
2. `dist` が変更前と**バイト単位で同一**である
3. E2E の失敗がすべて**転送層のもの**（`ERR_ABORTED` / `ERR_CONNECTION_TIMED_OUT` / `page.goto` のタイムアウト等）で、**アサーション失敗がゼロ**である

理由は、完了条件が存在する目的にあります。**E2E は「変更が挙動を壊していないこと」を示すための手段**であり、目的ではありません。`dist` がバイト単位で同一であることは、**緑の E2E よりも強い証明**です。同一の成果物が異なる挙動をすることはありません。

この例外を使う場合は、**3 条件を満たしていることをコミットメッセージに明記してください。**

> **これは狭い例外です。**実装に 1 行でも差分があれば適用できません。`dist` が同一でない限り、E2E は通してください。

---

> **`pnpm typecheck` は 2026-09-18 に追加された条件です（段階 0 完了時の指摘による）。**
> 当初の本書は完了条件に型検査を含めておらず、`pnpm lint:check` が `typescript-eslint` の構文ベースのルールしか見ないため、
> **`tsc` が通らないコードをコミットしても全チェックが緑になる**状態でした。A-9 で解消したのと同じ「検査されない領域」です。
> `typecheck` スクリプトの追加と、CI の `lint-and-test` ジョブへの組み込みもあわせて行ってください（未了の場合は段階 1 の着手前に）。

### 段階 0: 基盤整備

- `typescript` / `vue-tsc` / `typescript-eslint` を devDependencies に追加
- `tsconfig.json` を作成
  - `allowJs: true`（移行期間中の混在を許容）
  - `strict: true` を目標とするが、**段階的に引き上げてよい**（後述 6-1）
  - `declaration` / `emitDeclarationOnly` は段階 7 で使用
- `eslint.config.js` に TypeScript 用の設定を追加
- **`typecheck` スクリプトを追加する**（`"typecheck": "vue-tsc --noEmit"`）
- **CI の `lint-and-test` ジョブに `pnpm typecheck` のステップを追加する**
- **この段階ではソースを 1 行も変更しない**

> 段階 0 は 2026-09-18 に完了済みです（コミット `96a80df`）。
> ただし `typecheck` スクリプトと CI ステップは当時の本書に記載が無かったため未実施です。**段階 1 の着手前に補ってください。**

### 段階 1: `layerge/types.js` → `types.ts`

型の土台です。ここが他のすべてから参照されるため最初に行います。

- `@typedef` 群を `interface` / `type` へ移す
- **現行 `types.js` の忠実な翻訳とすること。**型を追加・削除・改名しない

> #### ⚠️ 本項の記述を 2026-09-18 に訂正しました
>
> 当初の本書は「**`index.d.ts` に現れる型と 1 対 1 で対応させる**」と書いていましたが、**これは誤りでした。**
>
> `layerge/types.js` と `index.d.ts` は**並行する 2 つの表現ではなく、目的の異なる別々の型集合**です。
> 前者は**実装の型語彙**、後者は**公開契約**です。実際に突き合わせると次の差があります（段階 1 着手前の調査で判明）。
>
> | 分類 | 件数 | 内容 |
> |---|---:|---|
> | **A.** `index.d.ts` のみ | 4 | `PresenterApi` / `PresenterApis` / `PresenterMap` / `LayergeRouter` |
> | **B.** `types.js` のみ | 7 | `PresenterHandleInternal` / `PendingPresenterNav`（内部型）、`LayergeMode` / `LayergeCloseOptions` / `BackgroundCompareMode` / `LayergeStateSnapshot` / `UseLayergeLinkResult`（`index.d.ts` 側ではインライン展開され名前を持たない） |
> | **C.** 同名で構造が異なる | 3 | `PresenterEntry` / `LayergeStore` / `CreateLayergeRouterOptions` |
>
> 本書が意図していたのは「**公開契約を変えるな**」であって、「2 ファイルを構造的に一致させろ」ではありません。
> 後者として読むと、C の内部フィールド（`_mountKey` 8 箇所、`_transitionManagedEntryIds` 8 箇所、`_isHidden` 7 箇所、`_invokers` 7 箇所ほかで実際に使用中）を落とすことになり、**段階 2〜5 で実装が型付け不能になります。**

#### 確定した方針（2026-09-18）

**段階 1 は純粋な翻訳作業です。型アーキテクチャの再設計は行いません。**

| 分類 | 段階 1 での扱い |
|---|---|
| **A.** `index.d.ts` のみの 4 型 | **段階 1 では新設しない。段階 5 で `createLayergeRouter.ts` に置く。**いずれも `createLayergeRouter` の公開面のみを記述する型であり、composables / components からの参照が 1 件も無いことを確認済みです |
| **B.** `types.js` のみの 7 型 | **名前付きのまま維持する。**インライン展開に合わせる変更はしない |
| **C.** 構造が異なる 3 型 | **`types.js` の構造を保持する。**内部フィールドには `@internal` を付し、公開の可否は段階 7 で決める |

理由は次のとおりです。

- **6-4**（`$layerge` ストアの内部メンバーをどう隠すか）が未解決であり、その決定手段は型定義を生成する**段階 7 に属します**
- **6-2**（生成物と手書き `index.d.ts` を段階 7 で 1 行ずつ突き合わせ、改善か契約変更かを判定する）が定められており、**C の構造差はまさにこの俎上に載せるべきもの**です。段階 1 で暗黙に解消すると、その判定機会そのものが失われます
- 段階 1 で内部フィールドを落とすと、代替となる内部用インターフェースを同時に設計する必要が生じます。これは **2-2（段階的に進める）の趣旨に反する**規模の作業です

### 段階 2: `layerge/internals/`

`env` / `keys` / `outcome` / `decisionTrace` / `devMetrics` の 5 ファイル。依存が最も少ない層です。

> **2026-09-18 訂正:** 当初の本書は本項の対象に `id` を挙げていましたが、**誤りでした。**`id` は `layerge/core/id.js` にあり、段階 3 の対象です。

- `internals` は**内部専用**です。公開エクスポートに昇格させないこと

### 段階 3: `layerge/core/`

`store` / `handle` / `id` の 3 ファイル。

#### 先に決めておくこと: `_kept` と `_keptEntries` の不一致（2026-09-18 決定）

段階 2 で、**型と実装が食い違っている箇所**が見つかりました。

| | 名前 | 実体 |
|---|---|---|
| 実装が読み書きするフィールド | **`_kept`** | `core/store.js:14` で初期化、`createLayergeRouter.js:1735-1739`、`LayergeView.vue:50` で使用 |
| `types.ts` の `LayergeStore` が宣言するフィールド | **`_keptEntries`** | **どこからも使われていない** |

つまり**型は存在しないフィールドを宣言し、実際に存在するフィールドを宣言していません。**段階 2 では `devMetrics.ts` がキャストで従来どおりの挙動を保っています（範囲外として正しい判断です）。

**決定: 段階 3 で、型を実装に合わせてください。**

- `LayergeStore` の `_keptEntries` を **`_kept` に改める**
- `devMetrics.ts` のキャストと説明コメントを外す
- **実装側は変更しないこと。**実装が真であり、型が誤っていました
- これは型のみの修正であり、挙動は変わりません。5-1（公開 API を変更しない）にも抵触しません（`_` 接頭辞の内部フィールドです）

### 段階 4: `layerge/composables/`

`usePresenter` / `useLayerge` / `usePresenterBindings` / `usePresenterLeaveGuard` / `useLayergeLink`。

- `usePresenterLeaveGuard` は**公開 API でありながら現在 `index.d.ts` に宣言がありません**（ROADMAP A-5）。本移行で自動的に解消されます
- `useLayergeLink` は 424 行あり、composables の中では最大です

### 段階 4-b: `noopHandle` に `settled` を追加する（2026-09-18 決定 / 段階 5 の前に実施）

段階 4 で、**実装が自身の公開契約に違反している箇所**が見つかりました。

`usePresenter()` は Presenter 配下でないとき `noopHandle` を返しますが、これは `close` / `closed` / `isActive` しか持たず、**`settled` を持ちません。**一方、公開型 `PresenterHandle` は `types.ts` でも `index.d.ts` でも **`settled` を必須として宣言しています。**

#### 決定: 実装を型に合わせる（選択肢 2）

```ts
const noopHandle: PresenterHandle = {
    close: () => {},
    closed: Promise.resolve(),
    settled: Promise.resolve({status: 'aborted'}),
    isActive: false
};
```

キャスト（`as PresenterHandle`）は不要になります。

#### なぜ選択肢 2 なのか

1. **`noopHandle` の存在理由そのものが「分岐させないこと」だからです。**`usePresenter` の JSDoc は「Page 上なら no-op を返します（**分岐不要**）」と明記しています。`settled` だけ欠けていると、Presenter 外で `usePresenter().handle.settled.then(...)` が例外になり、**呼び出し側は結局分岐を強いられます。**no-op として機能していません
2. **公開契約は既に `settled` の存在を約束しています。**`index.d.ts` が公開された時点で、利用者は `settled` があるものとして書けます。したがってこれは **API の追加ではなく、実装を公開済みの契約に合わせる是正**です
3. **選択肢 1 は公開型を変えることになり、5-1（公開 API を変更しない）に抵触します。**加えて、利用者に分岐を強いる方向であり、1 の理由と矛盾します

#### 値を `aborted` とする理由

何も開かれていないため `completed` ではなく、失敗していないので `failed` でもなく、後続に追い越されてもいないので `superseded` でもありません。2-1 の射影規則で、内部の `blocked`（何も起きなかった）は公開面では **`aborted`** に畳み込まれます。これに合わせます。`closed` が即座に resolve するのと同様、`settled` も即座に resolve します。

#### 5-1 の例外として扱います

本件は**実行時の挙動が変わります**（`undefined` → 解決済みの Promise）。5-1 は「本移行はリファクタリングであり機能変更ではない」としているため、**明示的な例外として記録します。**

例外を認める理由は、現状が公開契約違反であり、**放置したまま段階 7 で型定義を生成すると「型は `settled` があると言うが実物には無い」という状態が固定される**ためです。移行の目的に照らして、ここで直すのが正しい場所です。

**実施時の条件:**

- **独立したコミットとすること。**段階 5 に混ぜないでください
- **単体テストを追加すること。**Presenter 外で `usePresenter().handle.settled` が `{status: 'aborted'}` に解決されることを固定します。現在この経路を覆うテストは存在しません
- **`CHANGELOG.md` に記録すること。**利用者から見える修正です
- 実装の変更は `usePresenter` の `noopHandle` に限ること

> **補足:** `noopHandle` はライブラリ自身のコードからも到達します。`useLayergeLink.ts:194` と `usePresenterLeaveGuard.ts:185` が `usePresenter()` を呼んでおり、いずれも Presenter 外で使われ得ます。デモにも `CacheStatePage.vue` という到達経路があります。**机上の懸念ではありません。**

---

### 段階 5: `layerge/router/createLayergeRouter.ts`

**最難関です。単独の段階として扱ってください。**2,731 行あり、他と混ぜてはいけません。

#### 段階 5 を 2 つに分割します（2026-09-18 決定）

ファイルを途中まで変換することはできないため、本体の変換は 1 コミットにならざるを得ません。
しかし**型の追加は切り離せます。**切り離すことで、**唯一の契約変更リスクを 2,731 行の差分に埋もれさせずに済みます。**

**段階 5-a: `types.ts` に A 分類の 4 型を追加する（型のみ / 実装は変更しない）**

`PresenterApi` / `PresenterApis` / `PresenterMap` / `LayergeRouter` を `types.ts` へ持ち込みます。

- **`index.d.ts` の宣言と 1 行ずつ突き合わせて写すこと。**とりわけ `CreateLayergeRouterOptions<P extends PresenterMap = PresenterMap>` と `PresenterApis<P>` の**ジェネリックを必ず保つこと**
- この段階では `createLayergeRouter.js` は `.js` のままです。追加した型は未使用になりますが、それで構いません
- **台帳の「`CreateLayergeRouterOptions` のジェネリック有無」はここで決着します。**これが失われると利用者側で `router.modal.push()` が型エラーになる、本移行で唯一の契約変更リスクです

**段階 5-b: `createLayergeRouter.ts` 本体の変換**

**着手して最初にやること:** 本体を変換する前に、**ジェネリックが実際に機能することを型レベルで確認してください。**

```ts
// 一時ファイルで可（確認後に削除）
const r = createLayergeRouter({router, presenters: {modal: {component: X}}});
r.modal.push('/a');        // 型が付くこと
r.notDefined.push('/a');   // エラーになること
```

**2,731 行を変換し終えてから「ジェネリックが効かない」と分かるのが最悪の順序です。**先に確かめてください。

> #### ⚠️ プローブの書き方に落とし穴があります（段階 5-a で実地に遭遇）
>
> `presenters` を **`interface X extends Record<string, PresenterDefinition>`** の形で渡してはいけません。
> インデックスシグネチャが持ち込まれて `keyof P` が `string` に広がり、**未定義のキーでも API が生えてしまいます。**
> つまり「`r.notDefined.push()` がエラーになること」の確認が**通ってしまい、検証が空振りします。**
>
> 利用者がオブジェクトリテラルを直接渡す通常の使い方では推論にキーが保たれるため実害はありませんが、
> **検証がこの書き方だと「ジェネリックが効いている」と誤って判定します。**プローブはオブジェクトリテラルで書いてください。
>
> あわせて、**エラーになるべき箇所は `@ts-expect-error` で押さえてください。**
> 期待どおりエラーにならなければ tsc が「未使用ディレクティブ」として落とすため、
> 「エラーを期待したが実は通っていた」という見落としが構造的に起きなくなります（段階 5-a で採用した方法）。

#### 推奨する検証手段: `dist` の差分比較

本段階は**型のみの変換**であり、実行時の論理は変わらないはずです。したがって変換の前後で `pnpm build` を行い、**`dist/index.mjs` を比較する**ことで論理変更の混入を検出できます。

型注釈は除去されて出力されるため、整形の差はあっても**制御フローや式が変わっていれば差分に現れます。**完全一致は期待できませんが、差分を目視して「型の除去以外の変更が無い」ことを確認する価値はあります。A-8 で採った機械的照合に近い役割を果たします。

#### 想定される論点（いずれも決定済み。判断のために止まる必要はありません）

| 論点 | 参照先 |
|---|---|
| `PresenterTarget` の型ガード `isRouteTarget` の実装 | 6-3 |
| 内部実装での `any` の扱い | 6-1（ルールは error のまま、個別に理由付き抑止） |
| `reactive` の深いアンラップ衝突 | 6-5（注釈は入力側に置く） |
| 内部メンバーの露出 | 6-4（**段階 7 で決定。ここでは判断しないこと**） |

- ~~着手前に、ROADMAP A-6 のデッドコード `layerge/router/usePresenterLeaveGuard.js` を削除しておくこと~~ → **前提は充足済み**（2026-09-17、コミット `c4c2bb3` で削除）。`layerge/router/` 配下は `createLayergeRouter.js` の 1 ファイルのみです

### 段階 6: `.vue` ファイル

`LayergeView` / `LayergeTransition` / `LayergeLink` を `lang="ts"` 化。

- `vue-tsc` による型チェックをこの段階で有効化
- `LayergeLink` の props は現在 `index.d.ts` で `Component` としか宣言されておらず型が効いていません。ここで解消します

### 段階 7: 型定義の生成へ切り替え

> **2026-09-18 補足:** 本書のどの段階にも `layerge/index.js` の変換が記載されていませんでした。**記載漏れです。**
> 型定義の生成にはエントリが `.ts` である必要があり、受け入れ条件 1（`layerge/` 配下に `.js` を残さない）からも必須です。**段階 7 の前提として実施してください**（段階 7 の作業中に補われました）。
>
> あわせて、生成されたエントリには**型エクスポートが含まれません。**手書き `index.d.ts` が提供していた公開型 25 件を `index.ts` から明示的に再エクスポートし、手書き版と 1 対 1 に対応させてください。これを怠ると契約が壊れます。

- `vue-tsc --declaration --emitDeclarationOnly` で型定義を生成
- 生成物を `.d.cts` として複製する手順をビルドに組み込む
- **手書きの `index.d.ts` / `index.d.cts` を削除**
- `package.json` の `files` / `exports` / `types` を生成先に合わせて更新

### 段階 8: 仕上げ

- `tsconfig.json` から `allowJs` を外す
- JSDoc 規約の再定義（後述 5-2）
- README の記述更新（「Ships as JavaScript + JSDoc」の行）

---

## 5. 意図的な先送り

本移行では**やらないこと**を明記します。スコープの膨張を防ぐためです。

### 5-1. 公開 API の変更は行わない

**本移行はリファクタリングであり、機能変更ではありません。**

- 公開 API を追加・削除・改名しない
- 公開ステータスの 4 値（`completed` / `aborted` / `failed` / `superseded`）を変えない
- 公開状態（`LayergeEntryContext` のフィールド等）を増やさない
- `fakePath` の互換受付を削除しない（非推奨のまま維持）

「TypeScript にするついでに整理する」は禁止です。整理したい点が見つかった場合は ROADMAP に起票してください。

### 5-2. JSDoc 規約の再定義は移行完了後に行う

[docs/guidelines/jsdoc.ja.md](../guidelines/jsdoc.ja.md) の「2-3 型宣言時のルール」は、その大半が TypeScript の型注釈に置き換わります。

ただし規約の再定義は**移行の途中では行いません。**移行中に規約が動くと、どちらに従うべきかが不明になるためです。移行完了後、残すべき部分（日本語コメント、1 行目の形式、if/else と三項演算子のコメント、アノテーションコメント）に絞って書き直します。

**移行中は現行の JSDoc 規約がそのまま有効です。**型に関する記述は TypeScript 側に移りますが、説明文としての JSDoc は残してください。

### 5-3. デモとテストコードの `.ts` 化は行わない

`demo/`、`tests/`、`e2e/` は JavaScript のままとします。ライブラリ本体の移行と混ぜないためです。必要であれば別途起票してください。

---

## 6. 未解決の懸念

**自信が持てていない箇所を正直に記録します。**実装時にここで詰まったら、判断を下さずに相談してください。

### 6-1. `strict: true` をどこまで貫けるか

JSDoc 規約は `any` を原則禁止としていますが、`createLayergeRouter.js` の現行コードには `/** @type {any} */` によるキャストが複数あります。2,731 行を厳密に型付けした場合、内部実装で `any` や `unknown` を許容せざるを得ない箇所が出る可能性があります。

**方針:** 段階 0 では `strict` を緩めに始め、段階が進むごとに引き上げる。**ただし公開面（`index.d.ts` に出る型）には `any` を出さないことを絶対条件とする。**内部実装の厳密さと公開契約の厳密さを分けて考えてください。

#### 段階 8 での引き上げ結果（2026-09-18 / 受け入れ条件 9 の記録）

フラグごとに個別に有効化して実測しました。結果は次のとおりです。

| フラグ | 状態 | 備考 |
|---|---|---|
| `noImplicitThis` | **true** | 無修正で通過 |
| `strictBindCallApply` | **true** | 無修正で通過 |
| `useUnknownInCatchVariables` | **true** | 無修正で通過 |
| `strictFunctionTypes` | **true** | 無修正で通過 |
| `noImplicitAny` | **true** | 51 件を修正して達成 |
| `strictNullChecks` | **false** | 28 件が残る（下記） |
| `strictPropertyInitialization` | **false** | `strictNullChecks` への依存（単独では有効化できない） |

`any` は実装にも公開型にも 1 件もありません。`no-explicit-any` の抑止コメントも使っていません。

##### `strictNullChecks` を false のまま残す理由

28 件のうち **13 件が vue-router の型モデル差**に起因します。残り 15 件は通常の null 処理（`entry` / `_invokers` / 配列アクセス）で、個別に対処可能です。

```
Argument of type 'RouteLocationResolvedGeneric' is not assignable to
parameter of type 'RouteLocationNormalizedLoadedGeneric'.
  Types of property 'name' are incompatible.
    Type 'RouteRecordNameGeneric | null' is not assignable to type 'RouteRecordNameGeneric'.
```

`router.resolve()` が返す `RouteLocationResolved` は `name` が `null` を取り得ますが、公開型が使う `RouteLocationNormalizedLoaded` は取りません。**`strictNullChecks` を有効にすると、この 2 つが非互換になります。**

解消するには次のいずれかが必要です。

1. **公開型 `PresenterEntry.route` / `PendingPresenterNav.route` を `RouteLocationResolved` へ変更する** — 手書き `index.d.ts` は `RouteLocationNormalizedLoaded` を宣言しており、**契約変更にあたります**（受け入れ条件 6 / 8 に抵触）
2. **13 箇所をキャストで塞ぐ** — 型モデルの差を隠すだけで、`strictNullChecks` 本来の利益（null の取り違えの検出）がその範囲で失われます

**どちらも「仕上げ」の範囲を超える判断を含むため、実装側では選ばず false のまま残しました。**公開契約の変更を伴うため、判断が必要です。

> 残り 15 件の通常の null 処理は対処可能ですが、フラグは all-or-nothing のため、13 件を解決しない限り有効化できません。

#### `@typescript-eslint/no-explicit-any` との関係（2026-09-18 決定）

段階 0 で導入された `typescript-eslint` の `recommended` は、`no-explicit-any` を **error** としています。これは上記の方針（内部では `any` を許容し得る）より厳しい設定です。

**この不整合は、次の運用で解消します。**

- **ルールは error のまま維持します。**これが「公開面に `any` を出さない」の実質的な強制力になっているためです
- 内部実装でどうしても `any` が必要になった箇所は、**理由コメント付きの `// eslint-disable-next-line @typescript-eslint/no-explicit-any` で個別に抑止**してください
- **ルールを全体で弱めることはしないでください。**一度緩めると、公開面に `any` が漏れても気づけなくなります

これは A-10 で `no-console` に対して採った方針（`allow` を広げず、必要な 1 箇所だけ理由付きで抑止）と同じ考え方です。抑止コメントが増えてきた場合、それ自体が「型付けが破綻している」という信号になります。

#### `strict` をいつ引き上げるか（2026-09-18 追記）

当初の本書は「段階が進むごとに引き上げる」としか書いておらず、**いつ誰が判断するのかが不明でした。**次のとおり確定します。

- 中間段階での引き上げは実装側の裁量で構いません
- **段階 8（仕上げ）の時点で、`strict: true` の達成を試みてください**
- 達成できないフラグが残る場合、**残す判断を黙って通さないこと。**どのフラグを false のままにし、なぜそうするのかを本書の本節に追記してください。記録されない残置は認めません

### 6-2. 生成された型定義が現行の手書き型と一致しない可能性

**これが最大の懸念です。**

生成物が現行の `index.d.ts` と差分を持つことはほぼ確実です。問題は、その差分が次のどちらなのかを判定する必要があることです。

- **改善**（手書きが不正確だった。生成物のほうが実装に忠実）
- **契約変更**（利用者のコードが壊れる。許容してはいけない）

**対応方針:** 移行前に現行の `index.d.ts` を `docs/` 配下などへ凍結保存し、段階 7 で生成物と 1 行ずつ突き合わせてください。差分ごとに上記どちらかを判定し、記録を残すこと。**差分を目視で流さないでください。**

> **特に注意:** `usePresenterLeaveGuard` の宣言（A-5 / コミット `08a4065` で追加）は手書きであり、
> **`tsc` による検証を一度も受けていません。**他の宣言より誤りの可能性が高いため、差分レビューで重点的に確認してください。

#### 既知の差分台帳 ✅ **全項目が決着しました（段階 7 / `79375a3`）**

段階 7 の差分レビューは、手書き `index.d.ts` を凍結し、生成物との**相互代入可能性**を型レベルで機械照合する方法で実施されました（目視ではありません）。

| 結果 | 件数 |
|---|---|
| 公開型 25 + 公開値 6 = 31 件のうち**完全一致** | **26 件** |
| 差分 | 5 件。根は `LayergeStore` と `PresenterEntry` の 2 つで、残る 3 件（`LayergeRouter` / `createLayergeRouter` / `usePresenter`）はそこからの波及。**すべて 6-4 の決定による意図した差分** |

**契約変更は 1 件も発生していません**（受け入れ条件 6 を満たします）。

台帳に無い差分が 1 件検出され、**改善**と判定されました。`LayergeStore.presenters` の値型が、手書きでは `{component; stack; cache; display}` の全必須でしたが、実装は利用者が渡した `PresenterDefinition` をそのまま保持するため任意が正しい形です。**手書きが不正確でした。**

> **台帳を用意した効果が出ています。**レビューは「台帳に載っていない差分」1 件の判定に集中でき、残りは事前の判定を確認するだけで済みました。

---

#### 台帳（作成時の記録）


段階 1 の着手前調査で、**生成物と手書き `index.d.ts` の間に出ることが分かっている差分**を先に分類しておきます。
**段階 7 のレビューは、この台帳に載っていない差分＝想定外のものに集中してください。**台帳に載っているものは判定済みです。

| 予期される差分 | 判定 | 根拠 |
|---|---|---|
| `LayergeMode` / `LayergeCloseOptions` / `BackgroundCompareMode` / `LayergeStateSnapshot` / `UseLayergeLinkResult` が、インラインではなく**名前付きの型として出る** | **改善** | 構造は同一で、名前が付くだけ。利用者のコードは壊れません |
| `PresenterEntry` / `LayergeStore` に**内部フィールドが出現する**（`_mountKey` ほか） | **要対処**（契約変更ではない） | 6-4 の決定（`@internal` + `stripInternal` 等）で公開面から除外すること。**除外せずに公開すると利用者が依存し始めます** |
| `PresenterHandleInternal` / `PendingPresenterNav` が公開面に出る | **要対処** | 同上。内部型であり公開しません |
| `LayergeStore.pending` の型が `PendingPresenterNav \| null` として出る（手書きは `/** @internal */ pending: unknown`） | **要対処** | 段階 1 完了時の観察（2026-09-18）。`types.ts` 側には内部である旨の記載が無いため `@internal` が付いていません。**そのままだと内部型 `PendingPresenterNav` が公開面に漏れます。**6-4 の決定時に、このフィールドの扱いもあわせて決めてください |
| `LayergeStore` に `_keptEntries` が出る（実装には存在しないフィールド） | **要対処** | 段階 3 で `_kept` に是正すること（上記の決定）。是正前に段階 7 へ到達した場合、**存在しないフィールドを公開型が宣言している**ことになります |
| ~~`CreateLayergeRouterOptions` の**ジェネリック有無**~~ ✅ **決着済み**（段階 5-a / `ab83e96`） | ~~要確認~~ → **契約は維持されました** | 手書きは `<P extends PresenterMap = PresenterMap>`、`types.js` は非ジェネリック。**ジェネリックが失われると `router.modal` の型が効かなくなるため、契約変更に当たります。**段階 5 で必ずジェネリックを保つこと |

最後の 1 件は特に重要です。**`PresenterApis<P>` によるキー単位の型付けが失われると、利用者側で `router.modal.push()` が型エラーになります。**段階 5 の着手時に真っ先に確認してください。

### 6-3. `PresenterTarget` の判別が型レベルで曖昧になる

`PresenterTarget` は `RouteLocationRaw | Component | (() => Promise<any>)` のユニオンです。`RouteLocationRaw` 自体が `string | object` のユニオンであり、Vue の `Component` もオブジェクトです。

実装内の `LayergeLink.vue` には、この曖昧さを回避するためのコメントが既にあります。Component オブジェクトが `name` フィールドを持つため `{name: ...}` 形式の `RouteLocationRaw` と誤判定され得る、という問題です（実装では関数化して回避しています）。

TypeScript 化にあたっては `isRouteTarget` 相当を**型ガード（`x is RouteLocationRaw`）として実装する**必要があります。ここが素直に書けるかどうかは、やってみないと分かりません。

### 6-5. Vue / vue-router の型と衝突する既知パターン（2026-09-18 追記）

段階 3 で実際に遭遇したパターンを記録します。**段階 5 でも同種の衝突が起きます。**毎回調べ直さずに済むよう残します。

#### `reactive()` の深いアンラップとの衝突

`reactive<LayergeStore>({...})` と素直に書くと型エラーになります。`reactive` の戻り値型 `UnwrapNestedRefs<T>` が vue-router の `RouteLocationNormalizedLoaded` を深く展開し、`matched[].redirect` の構造が元の型と一致しなくなるためです（`Type 'unknown' is not assignable to type 'undefined'` まで降りていく長いエラーになります）。実行時に `markRaw` していても、型レベルの展開は止まりません。

**採用した書き方（段階 3 / `core/store.ts`）:**

```ts
const initial: LayergeStore = { /* ... */ };
return reactive(initial) as LayergeStore;
```

**この書き方が安全である理由を明記しておきます。**型注釈が `initial`（= `reactive` への入力）側にあるため、**プロパティの過不足と型の誤りはそこで検査されます。**`as` が無効化しているのは `UnwrapNestedRefs` という型変換だけで、実体の検査ではありません。

**やってはいけない書き方:**

```ts
return reactive({ /* ... */ }) as LayergeStore;   // 入力が無検査になる
return reactive({ /* ... */ }) as any;            // 論外
```

入力側の注釈を省くと、フィールドを書き間違えても通ってしまいます。**注釈は必ず入力側に置いてください。**

### 6-6. `.vue` の props を型ベース宣言に変えてはいけない（2026-09-18 追記 / 段階 6 で実地に遭遇）

`defineProps<T>()` + `withDefaults()` の型ベース宣言へ移すと、**ランタイムの props 宣言が変わります。**型注釈の追加のつもりが、実行時の挙動を変えます。

| prop | ランタイム宣言（変換前） | 型ベース宣言にした場合 |
|---|---|---|
| `presenter` | `{type: String, required: true}` | **`{}`** — `required` が失われる |
| `component` | `{type: [Object, Function]}` | **`{type: Function}`** — オブジェクトを渡すと dev 警告が出る |

`<LayergeLink :component="SomeComponent">` にコンポーネントオブジェクトを渡すのは主要な使い方であり、**実害があります。**

**採用する書き方:** ランタイム宣言（`defineProps({...})`）を保ったまま、`PropType<T>` で型を与えてください。

```ts
const props = defineProps({
    presenter: {type: String as PropType<string>, required: true},
    component: {type: [Object, Function] as PropType<Component>, required: false}
});
```

この形なら `dist` の props 出力が変換前と完全に一致し、かつ利用側で props の型が効きます（段階 6 で、誤用 3 件が型エラーになり正しい 2 例は通ることを確認済み）。

> **この種の変化は `typecheck` では検出できません。**段階 5-b と同じ `dist` の比較でのみ見つかります。`.vue` を触る際は必ず比較してください。

### 6-4. `$layerge` ストアの内部メンバーの露出 — **決定済み（2026-09-18）**

段階 7 の実測を受けて確定します。**結論は「`stripInternal` を適用する」**です。

#### これは受け入れ条件 8 の例外ではありません

実装側から「手書き版が公開していた 12 メンバーが消えるため、受け入れ条件 8『公開 API の削除が 1 件も発生していない』に抵触する」という論点が挙がりました。**この整理は誤りです。**根拠は 2 つあります。

1. **手書き `index.d.ts` は、これらを既に `/** @internal */` と宣言しています**（100-116 行の `pending` / `_exitPresenterMode` / `_closeTop` / `_setInvoker` ほか）。`@internal` は「公開契約に含めない」という明示的な宣言です
2. **README も明言しています。**190 行目に「`router.$layerge` — the internal store (treat as read-only; its `_`-prefixed members are internal)」とあります

つまり、**これらは最初から公開契約ではありませんでした。**`stripInternal` が未適用だったために、公開されるつもりのないものが `.d.ts` に出ていただけです。

**受け入れ条件 8 が守っているのは公開契約であり、`@internal` と宣言済みのメンバーはその外側です。**したがって除去は条件 8 の違反ではなく、**公開される型を、ライブラリ自身が既に宣言していた内容に一致させる是正**です。

> 条件 8 の文言を次のとおり明確化します。**「公開 API」とは `@internal` を付していない公開面を指します。**`@internal` 宣言済みメンバーの除去は、条件 8 の対象外です。

#### `stripInternal` だけでは足りない 3 箇所の扱い

実測で、`stripInternal` 適用後も内部型が漏れる箇所が 3 つ判明しています。個別に決めます。

| 箇所 | 決定 | 理由 |
|---|---|---|
| `PresenterEntry.handle: PresenterHandleInternal` | **`PresenterHandle` に変更する** | 手書き `index.d.ts:55` は `handle: PresenterHandle` でした。**生成物のほうが誤りで、手書きが正しい。**`PresenterHandleInternal` は `close` / `closed` ほか公開メンバーを構造的に含むため、代入可能性は保たれます |
| `PendingPresenterNav.handle: PresenterHandleInternal` | 同上 | 同じ理由。ただし `PendingPresenterNav` 自体が公開面から消えるため（下記）、実質は影響しません |
| `LayergeStore.pending: PendingPresenterNav \| null` | **`@internal` を付す** | 手書き `index.d.ts:100-101` が `/** @internal */ pending: unknown;` としていたのと整合します |

あわせて次も確定します。

- **`internalNav` に `@internal` を付す。**手書き版には存在しないフィールドであり、除去しても失われる契約はありません
- **`PendingPresenterNav` と `PresenterHandleInternal` を `index.ts` から再エクスポートしない。**いずれも内部型で、手書き版の公開型 25 件にも含まれていません

#### CHANGELOG に記載してください

TypeScript 利用者のうち、`router.$layerge._closeTop` のように `_` 接頭辞のメンバーへ到達していたコードは、**今後型エラーになります。**意図した変更ですが、利用者から見える変化です。「内部メンバーは元から `@internal` 宣言されており、公開契約ではなかった」旨を添えて記録してください。

---

#### 以下は決定前の記録です



`LayergeStore` は `_exitPresenterMode` / `_closeTop` などアンダースコア接頭辞の内部メンバーを持ち、現在は `/** @internal */` で注釈されています。

TypeScript 化後、これらを公開型からどう隠すか（`@internal` + `stripInternal`、別インターフェースへの分離、など）を決める必要があります。**公開型に内部メンバーが出てしまうと、利用者がそれに依存し始めます。**

---

## 7. テスト観点

**なぜその観点が必要なのか**を添えます。観点だけ渡すと、意図を外したテストが書かれるためです。

| 観点 | なぜ必要か |
|---|---|
| E2E 43 本が全段階で緑 | 本移行を「リファクタリング」と主張できる唯一の根拠。公開挙動の契約そのもの |
| 各段階の完了時にテスト実行 | 一括ではなく段階的にした理由が、問題の切り分け可能性にあるため。段階をまたいで失敗すると利点が失われる |
| `consumer-vue-router-4` / `-5` でのビルド確認 | **生成された型定義が実際に解決できるかの唯一の実地検証。**パッケージ内部で型が通ることと、消費側で通ることは別問題 |
| 現行 `index.d.ts` と生成物の差分レビュー | 6-2 のとおり、改善と契約変更を区別するため。自動テストでは判定できず、人間の判断が要る |
| `fakePath` を使った既存呼び出しが型エラーにならないこと | 非推奨だが互換受付を維持すると決めたため。型で弾いてしまうと互換性を破る |
| 公開型に `any` が出現しないこと | 6-1 の絶対条件。内部の妥協が公開面に漏れていないかの検証 |

---

## 8. 受け入れ条件

本移行は、以下がすべて満たされた時点で完了とします。

1. `layerge/` 配下に `.js` ファイルが存在しない（`.ts` / `.vue` のみ）
2. `tsconfig.json` から `allowJs` が外れている
3. 手書きの `index.d.ts` / `index.d.cts` が削除され、型定義がビルドで生成されている
4. `pnpm typecheck` / `pnpm build` / `pnpm test` / `pnpm lint:check` / `pnpm test:e2e` がすべて成功する
4-b. CI に型検査のステップが組み込まれている
5. `consumer-vue-router-4` と `consumer-vue-router-5` の両方で、インストール・ビルド・**型解決**が成功する
6. 生成された型定義と移行前の `index.d.ts` の差分がすべてレビューされ、各差分が「改善」か「契約変更」かが記録されている。**契約変更は 1 件も存在しないこと**
7. 公開型に `any` が出現しない
8. 公開 API の追加・削除・改名が 1 件も発生していない（**「公開 API」とは `@internal` を付していない公開面を指します。**6-4 の決定を参照）
9. `strict: true` が達成されている。または、false のまま残したフラグとその理由が本書の 6-1 に記録されている

---

## 関連ドキュメント

- [roadmap.ja.md](./roadmap.ja.md) — 公開に向けた残課題の全体像
- [motivation.ja.md](../motivation.ja.md) — 設計思想と非目標（移行中も遵守すること）
- [guidelines/jsdoc.ja.md](../guidelines/jsdoc.ja.md) — 現行の JSDoc 規約（移行完了まで有効）
- [../AGENTS.md](../../AGENTS.md) — AI エージェント向けの作業指示
