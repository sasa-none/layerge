# npm 公開に向けた残課題

最終更新: 2026-09-18（B-1 段階 5-b 完了。A-11 / A-12 を起票）

このドキュメントは、Layerge を npm に公開するまでに残っている作業を記録します。
優先度は「公開の可否に直結するか」で判断しています。

npm レジストリ上で `layerge` という名前は**未使用であることを確認済み**です（404）。名前の確保は可能です。

---

## 担当分担

| 担当 | 項目 |
|---|---|
| **Claude Code**（実装） | A-2 / A-3 / A-5〜A-10 / B-2〜B-6 / **B-1（TypeScript 移行）** |
| **Cowork**（仕様の明文化・ドキュメント） | 仕様書の作成と更新、C-1、C-2、JSDoc 規約の再定義 |
| **ユーザー本人** | A-4（package.json メタデータ。リポジトリ構成を検討中のため、決定後に本人が記載） |

#### Cowork 側が独立検証できる範囲（重要）

Cowork は接続フォルダを Linux シェル経由で参照しますが、**`node_modules` にインストールされているネイティブバイナリは Windows 向け**です（`@rolldown/binding-win32-x64-msvc` のみ）。

そのため Cowork 側では次のようになります。

| 検証 | 可否 |
|---|---|
| ソース・設定・diff・git 履歴の読解 | **可能** |
| `eslint` / `node scripts/*.mjs`（純粋な JS） | **可能** |
| `vitest` / `vite build` / Playwright | **不可**（ネイティブバイナリがプラットフォーム不一致で起動しない） |

**テストの実行結果については、Cowork は実装側の報告に依存します。**

> **運用上の注意（2026-09-18 に実際に発生）:** Cowork が書いた未コミットの docs が、実装側の `git stash` / `pop` の過程で**失われたこと**があります（A-11 の完了記録）。
> **Cowork の docs 編集は、次のコミットに必ず含めてください。**`git stash` を行う前に未コミットの `docs/` があれば、先にコミットするか、少なくとも失われていないことを pop 後に確認してください。代わりに Cowork は「そのコミットが当該テストに影響し得るファイルを触っているか」を git から構造的に検証します。実行結果そのものを二重化したい場合は CI の記録を根拠としてください。

---

B-1 は [spec-typescript-migration.ja.md](./spec-typescript-migration.ja.md) を契約として実装してください。
**同書で曖昧な箇所を見つけた場合、実装側で判断せず、仕様書を更新してから進めてください。**

### Claude Code への着手順

1. ~~**A-2 / A-3**（git init と `.gitignore`）~~ ✅ **完了**（コミット `9bfdf24`。`.gitattributes` で改行コードを LF に統一する対応も追加されています）
   以下は当初の指示です。**必ず最初に行うこと。**
   現在このリポジトリは版管理されていないため、これ以降の削除・改名・移行が**取り消せません。**
   特に A-6 はファイル削除、B-1 は全ファイルの書き換えを伴います。退避先を作ってから着手してください。
2. ~~**A-6**（デッドコード削除）~~ ✅ **完了**（コミット `c4c2bb3`）
3. ~~**A-5**（型定義に `usePresenterLeaveGuard` 追加）~~ ✅ **完了**（コミット `08a4065`）
4. ~~**A-7**（デモの `url` 移行）~~ ✅ **完了**（コミット `f7de883`）
   4-b. ~~**A-8**（`fakepath` 命名の一掃）~~ ✅ **完了**（コミット `df2359d`）
5. ~~**A-9**（lint の検査範囲を揃える）~~ ✅ **完了**（コミット `765c0d3`）
   5-b. ~~**A-10**（`no-console` の環境依存解消）~~ ✅ **完了**（コミット `f999228`）
6. ~~**B-2**（CI）~~ ✅ **完了**（コミット `9fd3baf`）
   6-b. ~~**B-3 / B-4 / B-5**（CI の追補）~~ ✅ **完了**（`b1133fc` / `0f9870c` / `2af0004`）
7. **B-1**（TypeScript 移行）← **次はここ。**仕様書に従い段階 0 から順に。**8 段階を一度に実施せず、段階ごとに区切ること**

> 各項目の完了条件は共通して **`pnpm test` と `pnpm lint:check` が通り、E2E 43 本が緑であること**です。
> 1 項目ごとにコミットを分けてください。

---

## 優先度 A — 公開前に必ず解消すべきもの

### A-1. README の API リファレンス ✅ 対応済み（2026-09-17）

README の Public API セクションを実装基準で全面改訂しました。

- オプション一覧を `url` 基準に変更。`fakePath` は「Deprecated since v3.0（互換のため受付継続）」として 1 行に降格
- 未記載だった公開 API を追記: `presenterDefaults` / `backgroundCompare` / `pushAsync` / `closeAsync` / `handle.settled` / `<LayergeLink>` / `useLayergeLink()` / `usePresenterLeaveGuard()`
- `controlledHooks`、mount 解決順序、`PresenterHandle`、`LayergeEntryContext` を表で明文化
- 解説・サンプル・ケーススタディの `fakePath` を `url` へ統一（全 18 箇所を精査）
- Composables / Components を独立セクションに分離

**記載内容はすべて実装ソースから確認しました。**`docs/v3.0.md` の転記は行っていません（後述の A-5 のとおり、同書には誤りがあったため）。

---

### A-2. git リポジトリの初期化 ✅ 対応済み（2026-09-17）

コミット `9bfdf24`。以下は着手時の記録です。


`.git` が存在しません。公開パッケージとして次が成立していません。

- `package.json` に `repository` / `homepage` / `bugs` フィールドがなく、**npm ページからソースやイシュー報告先へ辿れない**
- 変更履歴が残っておらず、`CHANGELOG.md` の記述を裏付けるコミットがない
- CI を設置できない

**対応方針:** `git init` → `.gitignore` 整備 → 初回コミット。

リモートリポジトリの作成と `package.json` へのメタデータ追加（A-4）は**ユーザーが検討中**のため、ここでは行いません。
ローカルリポジトリの初期化は独立して進められます。**A-4 の決定を待たずに着手してください。**

---

### A-3. `.gitignore` の整備 ✅ 対応済み（2026-09-17）

コミット `9bfdf24`（A-2 と同時）。`.gitattributes` による改行コードの LF 統一もあわせて追加されています。以下は着手時の記録です。


現在リポジトリ直下に次が置かれています。

| パス | サイズ | 扱い |
|---|---|---|
| `layerge.zip` | 約 332 KB | 作業用アーカイブ。リポジトリに含めない |
| `layerge-1.0.0.tgz` | 約 38 KB | `npm pack` の生成物。含めない |
| `dist/` | — | ビルド生成物。含めない（`files` で公開には含まれる） |
| `test-results/` | — | Playwright の出力。含めない |
| `node_modules/` | — | 含めない |

**対応方針:** `.gitignore` を作成したうえで初回コミットを行う。既存の zip / tgz は削除するか、リポジトリ外へ退避する。

---

### A-4. `package.json` のメタデータ不足 🟡

**担当: ユーザー本人／状態: 検討中**

リポジトリの公開先を検討中のため、決定後にユーザーが記載します。**Claude Code はこの項目に手を入れないでください。**

決定時に埋めるべきフィールドを控えとして残します。

| フィールド | 用途 | 備考 |
|---|---|---|
| `repository` | npm ページからソースへのリンク | `{"type": "git", "url": "git+<repo-url>.git"}` 形式 |
| `homepage` | ドキュメントの入口 | リポジトリ URL か、将来のドキュメントサイト |
| `bugs` | イシュー報告先 | `CONTRIBUTING.md` がここへの導線を前提にしている |
| `author` | 作者表記 | `LICENSE` の著作権者は `YUKKY`。表記を揃えること |
| `publishConfig` | 公開設定 | スコープなしのため `{"access": "public"}` の明示を検討 |

> **A-2（git init）はこの決定を待つ必要がありません。**ローカルリポジトリの初期化と `.gitignore` の整備は先に進めてよく、
> リモート URL とメタデータは後から追加できます。Claude Code はこの項目でブロックしないでください。

---

### A-5. 型定義への `usePresenterLeaveGuard` 追加 ✅ 対応済み（2026-09-17）

コミット `08a4065`。`index.d.ts` / `index.d.cts` の 2 ファイルのみの単独コミットです。

本書に記載していた貼り付け用の宣言は、実装（`layerge/composables/usePresenterLeaveGuard.js`）と JSDoc に突き合わせて検証したうえで採用され、**修正は不要でした。**

これにより `layerge/index.js` の公開エクスポート **9 個すべてに型宣言が揃いました。**

| 公開エクスポート | 型宣言 |
|---|---|
| `createLayergeRouter` / `LayergeView` / `LayergeTransition` / `LayergeLink` | 既存 |
| `usePresenter` / `useLayerge` / `usePresenterBindings` / `useLayergeLink` | 既存 |
| `usePresenterLeaveGuard` | 本コミットで追加 |

補足事項:

- `Ref` 型が未 import だったため、`vue` からの型 import に追加されています
- 新しい `interface` / `type` は公開していません（[AGENTS.md](../../AGENTS.md) の「公開 API を増やさない」に従い、インライン型のまま）
- `usePresenterLeaveGuard.js` は `__layergeRunPresenterLeaveGuard` 等の内部関数も export していますが、`index.js` が名前指定の re-export（`export *` ではない）のため公開面には漏れていません
- **`tsc` による型検査は未実施です。**TypeScript が未導入であり、導入すると `package.json` と lockfile が変わるため A-5 の範囲外と判断されました。B-1 で型定義がビルド生成に一本化されれば、この宣言も自動検証の対象になります

> **B-1 への申し送り:** 本宣言は手書きであり、まだ機械的な検証を受けていません。
> 仕様書 6-2「生成された型定義が現行の手書き型と一致しない可能性」の差分レビューでは、**この宣言も検証対象に含めてください。**

---

### A-6. デッドコードの削除 ✅ 対応済み（2026-09-17）

コミット `c4c2bb3`。`layerge/router/usePresenterLeaveGuard.js`（99 行）を削除しました。**他の変更を含まない単独コミットです。**

削除前の検証で、当初の想定より深刻な状態であることが判明しました。

| 検証項目 | 結果 |
|---|---|
| ソース中の import | **0 件**（参照は docs のみ） |
| 実際の利用先 | `index.js` / `createLayergeRouter.js` / `internals/devMetrics.js` / デモはすべて `layerge/composables/` 側を指していた |
| 依存先 `router.$layerge.registerLeaveGuard` | **実装がリポジトリに存在しない** |

つまりこのファイルは「import されていない」だけでなく、**仮に import して使ってもガードが登録されず、無言で機能しない**コードでした。
`docs/v3.0.md` が説明していたのは、公開されておらず、かつ動作もしないこの実装だったことになります。

削除後の検証はすべて緑です。`pnpm test`（28 テスト）、`pnpm lint:check`（0 errors、警告は 89 → 87 に減少）、`pnpm test:e2e`（43 スペック / 58 テスト）、`pnpm build` が成功し、`layerge/index.js` の公開エクスポートは削除前後で変化していません。

関連ドキュメント（`docs/v3.0.md` / 本書 / TypeScript 移行仕様書）は Cowork 側で更新済みです。

---

### A-7. デモの `url` 移行 ✅ 対応済み（2026-09-17）

コミット `f7de883`。`demo/src` 配下の `fakePath` 呼び出し 12 箇所を `url` へ置き換え、画面表示のコード例・説明文も揃えました。**`demo/src` に `fakePath` の文字列は 1 件も残っていません。**

テスト ID `modal-replace-fakepath` を `modal-replace-url` へ改名し、参照する E2E スペック 2 本を追従。README のデモ節とケーススタディ 3 も実態に合わせて更新済みです。

#### 互換性が保たれている根拠（検証済み）

文字列を渡した場合、`url` と `fakePath` は `createLayergeRouter.js` 内で**同じ `resolveUrlLocation()` に入り**（2050-2054 行）、`allowUnmatched` の判定も両者を同列に扱います（2092 行）。デモが渡すのはすべて文字列パスのため、置き換えによる挙動差はありません。

#### E2E から `fakePath` の直接検証が消えたことについて

デモが `url` を使うようになったため、**E2E は `fakePath` オプションを直接渡さなくなりました。**これを許容する判断の理由を記録します。

- `url` と `fakePath` は**履歴・ルーターに触れる前に** `resolveUrlLocation()` へ収束します。したがって下流の挙動は構造上同一で、E2E で両方を流しても同じコードを二度通るだけです
- `fakePath` に固有なのは「`options.fakePath` を読む」という入口の配線のみで、これは**単体テストが直接カバーしています**（`tests/createLayergeRouter.test.js:222`、`tests/v3x_async_api.test.js:18,43,44` の計 5 箇所）
- よって単体テストで十分と判断しました。**`fakePath` の互換受付を削除する際は、この 5 箇所が検証の所在です**

---

### A-8. `fakepath` 命名の一掃 ✅ 対応済み（2026-09-17）

コミット `df2359d`。E2E スペック 5 本と `demo/src/presenters/FakePathContent.vue`（→ `UrlOverlayContent.vue`）を `git mv` で改名し、テスト ID 5 個・識別子・15 本のスペックのテスト名とコメント・README を更新しました。

**検証済みの事実:**

- `layerge/` 配下と `tests/` は **1 行も変更されていません**
- 6 件の改名はすべて git 上で rename として追跡されています（履歴が追える）
- E2E スペック数は **43 本のまま**（取りこぼしも重複もなし）
- `e2e` / `demo/src` に `fakepath` の文字列は残っていません。README に残るのは非推奨オプション `fakePath` の API 記述のみで、これは正しい記述です
- テスト ID に重複はなく、`modal-url` と `modal-url-query-hash` は Playwright の `getByTestId`（完全一致）で区別されます
- 仕様上の URL（`/fake/help`、`/fake/replace`、`/modal/fake-help`）は保持されています。これらは API 名ではなくルート定義であり、変更すれば挙動変更になるため据え置きが正しい判断です
- 単体テストの `fakePath` 直接検証 5 箇所は維持されています（A-7 に記録した「互換の所在」）

検証手法として、**対応表による機械的置換を変更前のファイルに適用し、変更後と照合する**方法が採られました。20 ファイル中 18 ファイルが完全一致で、残る 2 件（README の文面、prettier による属性整形）も意図されたものです。純粋な改名であることが機械的に裏付けられています。

---

### A-9. lint の検査範囲を揃える ✅ 対応済み（2026-09-17）

コミット `765c0d3`。`pnpm lint:check` は demo を含めて **exit 0** になりました。

#### 是正された非対称（2 件）

**1. 検査範囲**（本項目の当初の目的）

`lint:check:js` / `lint:check:css` の対象に `demo/src/**` を追加し、自動修正側（`lint:js` / `lint:css` / `format`）と範囲を一致させました。

**2. 整形の二重管理**（作業中に判明した、より根深い問題）

`eslint.config.js` が `prettier` 設定（`indent` を無効化する）を読み込んだ**後**に `indent: ['error', 4]` を再有効化していたため、**`eslint --fix` が出力した整形を同じ ESLint が error として弾く**状態でした。三項演算子の分岐に関数本体やオブジェクトリテラルが来ると必ず衝突します。

コード側を書き換えるのではなく `indent` を外し、代わりに `prettier/prettier` を warn から **error** へ引き上げて検査の実効性を保つ、という対応が採られました。**整形の権威を Prettier 単独にする判断であり、妥当です。**

#### ライブラリ本体の変更について（検証済み）

本コミットは `layerge/` 配下 5 ファイルにも及んでいます。空白差分を無視した diff を確認したところ、**すべて Prettier による行の折り返しと、`eslint-disable` コメントの削除、JSDoc の補完でした。挙動を変える変更はありません。**

唯一意味的に触れているのは `handle._id || handle.entryId ? (...) : (...)` の冗長な括弧の除去ですが、`||` は `?:` より結合が強いため等価です。

#### ドキュメント側の追従（Cowork 対応済み）

`prettier/prettier` を error に引き上げたことで、[コーディング規約](../guidelines/coding.ja.md) の記述と実態に矛盾が生じたため訂正しました。

| 項目 | 旧記述 | 訂正後 |
|---|---|---|
| 行長 | 「行長制限なし（可読性優先）」 | **110 文字**（`printWidth: 110`）。error として強制されるようになったため |
| 整形の権威 | 明記なし | **Prettier が唯一の定義元**であることを明記 |
| インデント | 「4 スペース」 | 4 スペース（`tabWidth: 4` が担保。テンプレートは `vue/html-indent`） |

---

### A-10. `no-console` の環境依存の解消 ✅ 対応済み（2026-09-17）

コミット `f999228`。`NODE_ENV` 依存をやめ、固定値にしました。

```js
'no-console': ['warn', {allow: ['warn', 'info', 'debug', 'error']}],
'no-debugger': 'warn',
```

#### 検証済みの事実

| 条件 | `pnpm lint:check` | 指摘件数 |
|---|---|---|
| `NODE_ENV` 未設定 | exit 0 | 0 errors / 55 warnings |
| `NODE_ENV=production` | exit 0 | 0 errors / 55 warnings — **完全一致** |

`no-console` / `no-debugger` の指摘は **0 件**です。B-2 の CI が `NODE_ENV` をどう設定しても lint 結果は変わりません。

**根本原因が消えたことも実証されています。**`pnpm lint` を再実行しても `eslint-disable-next-line no-console` が削除されなくなりました。ルールが常に有効なため「未使用ディレクティブ」と判定されないためです。A-9 で 3 件が消えた事故は再発しません。

#### ⚠️ 本書の記載ミスと、その訂正

**本項目の起票時、本書は「`console.log` は 1 箇所もありません。したがって `allow` 指定での指摘は 0 件」と記載していましたが、これは誤りでした。**

実際には [demo/src/navLog.js:75](../../demo/src/navLog.js) に 1 件存在しました。デモのナビゲーション結果を出力する意図的なものです。実装側で、理由コメント付きの `eslint-disable-next-line` により抑止されています（`allow` に `log` を足すとルールの意味が失われるため、この対応が正しい判断です）。

**誤った原因:** 使用実態を調べる際、検索範囲を `layerge/` に限定したまま、結論を「lint 対象全体」について書いてしまいました。**A-9 で lint の検査範囲に `demo/src` が加わった直後であり、確認範囲もそれに合わせて広げるべきでした。**

実際の使用実態は次のとおりです。

| メソッド | 件数 | 扱い |
|---|---:|---|
| `console.warn` | 15 | `allow` でカバー |
| `console.info` | 3 | `allow` でカバー |
| `console.debug` | 3 | `allow` でカバー |
| `console.error` | 2 | `allow` でカバー |
| `console.log` | **1** | `demo/src/navLog.js` — 個別に抑止 |

> **教訓（今後の起票時に適用すること）:** 本書に数値や「〜は存在しない」と書く場合、**確認コマンドの対象範囲が結論の範囲と一致しているか**を確かめること。
> 本件は実装側が本書の数値を鵜呑みにせず実測したために発見されました。**本書の記載は実装にとって契約ですが、無謬ではありません。**齟齬を見つけた場合は本書を疑ってください。

---

### A-11. `settled` が失敗時に不正な値を返していた ✅ 対応済み（2026-09-18 / `664eeab`）

段階 5-b（TypeScript 移行）で発見（2026-09-18）。**移行前から存在する実装の欠陥**であり、移行が原因ではありません。

#### 何が起きているか

`settleOutcomeInternal()` は `LayergeOutcomePublic`（= `{traceId, status}`）を返します。ところが `createLayergeRouter.ts` の 2 箇所が、**その戻り値そのものを `status` に入れています。**

```ts
const publicStatus = settleOutcomeInternal({...});   // {traceId: '...', status: 'failed'}
handle._resolveSettled({status: publicStatus});      // ← status がオブジェクトになる
```

結果として `settled` は次の値で解決します。

```js
{status: {traceId: 'xyz', status: 'failed'}}   // 実際
{status: 'failed'}                              // 公開契約が約束している形
```

`_resolveSettled` の呼び出しは全 4 箇所で、**残り 2 箇所（`'superseded'` / `'completed'`）は文字列を正しく渡しています。**壊れているのは失敗系の 2 箇所だけです。

#### 利用者から見た影響

**`pushAsync()` / `closeAsync()` / `handle.settled` は、失敗を検知するための API です。その API が失敗時にだけ壊れています。**

```js
const result = await router.modal.pushAsync(target);
if (result.status === 'failed') {   // ← 永遠に false になる
    // 失敗時の処理が実行されない
}
```

公開ステータスを 4 値に固定するという契約（[motivation.ja.md](../motivation.ja.md) の原則 3、および `PresenterAsyncResult` の型宣言）に違反しています。

#### なぜテストをすり抜けたのか（重要）

**テストの命名が、検証している内容より広いことを約束していました。**

| テスト | 名前が主張すること | 実際に検証していること |
|---|---|---|
| `e2e/v4_failed_settle_reject_push.spec.js` | 「router.push の reject が **settled as failed** になる」 | **コンソールログ行** `[layerge] outcome ... status=failed` と DecisionTrace のダンプ。`settled` の解決値は**一切見ていない** |
| `e2e/v4_failed_settle_throw_guard.spec.js` | 同上 | 同上 |

単体テスト（`tests/v3x_async_api.test.js`）は `settled` の解決値を厳密に検証していますが、**対象が `completed` / `superseded` / `aborted` の 3 値のみ**です。

> **`settled` について `failed` を検証しているテストは 1 つも存在しません。そして壊れているのは `failed` の経路だけです。**

観測系（ログ・トレース）の実装は正しく、公開 API の経路だけが誤っています。テストは観測系しか見ていなかったため、両者の乖離が検出されませんでした。

#### 対応方針

段階 4-b と同じ扱い（独立コミット + テスト + CHANGELOG）とします。ただし**是正はコードだけでは足りません。**

1. **実装の修正** — 2 箇所を `{status: publicStatus.status}` に是正する。段階 5-b で入れた `as unknown as` のキャストと注記コメントは不要になります
2. **単体テストの追加** — `settled` が `{status: 'failed'}` に解決されることを固定する。**現在この経路を覆うテストは存在しません**
3. **E2E の是正** — 上記 2 本の spec に、`settled` の解決値そのものを検証する assertion を追加する。**ログ行だけを見て「settled as failed」と名乗るのをやめること。**これをしないと同じ欠陥が再発しても再び検出されません
4. **`CHANGELOG.md` に記録** — 利用者から見える修正です

#### 対応結果（コミット `664eeab`）

4 点すべて実施済みです。実装の是正 2 箇所（`as unknown as` のキャストは不要になり削除）、単体テスト 4 ケース（**是正を戻すと 4 件すべてが落ちる**ことを確認済み）、E2E 2 本への `settled` 解決値の assertion 追加、CHANGELOG の記載。

**再発防止として最も効いているのは、デモ側の可視化です。**`V3AdvancedDemoPage.vue` が `settled` の `status` を受け取り、**文字列以外なら `invalid:<JSON>` として表示します。**契約違反が黙って通らず、画面に出ます。是正を戻して E2E を流すと、実際に壊れた値が出て落ちました。

```
Expected: "settled: failed"
Received: "settled: invalid:{"traceId":"trace_...","status":"failed"}"
```

#### 副産物: 失敗系 2 経路のステータスが異なることが判明しました

是正の過程で、**失敗の種類によって settle されるステータスが違う**ことが分かりました。

| 経路 | 契機 | `settled` |
|---|---|---|
| `cancelHandle('failed', 'routerNavigationFailed')` | beforeEach の throw など | `failed` |
| afterEach の `routerFailure` | ルータが failure を報告 | **`aborted`** |

これは欠陥ではなく設計どおりです（内部 status が `aborted` であり、2-1 の射影規則に従っています）。しかし **README は 4 値を列挙するだけで、どの状況でどれになるかを説明していませんでした。**

`if (result.status === 'failed')` だけで「うまくいかなかった場合」を捕まえようとすると、**ルータ起因の失敗を取りこぼします。**利用者が踏みやすい落とし穴のため、README に各値の発生条件の表と注意書きを追記済みです。

---

### A-12. `finalizeOutcome` が第 3 引数を捨てていた ✅ 対応済み（2026-09-18 / `b35b069`）

段階 5-b で発見。呼び出し側 1 箇所が `finalizeOutcome('failed', 'routerNavigationFailed', err)` と error を渡していますが、関数は 2 引数しか使っておらず、**error は捨てられています。**

診断情報が失われるだけで、公開契約には影響しません。段階 5-b では型として第 3 引数を宣言し、実態を可視化したうえで未使用のまま残してあります。

**A-11 と同じコミットに混ぜないでください。**重大度が異なり、混ぜると A-11 の修正内容が読みにくくなります。

---

### A-13. `<LayergeLink>` の死んだ `elRef` の削除 ✅ 対応済み（2026-09-18 / `258742e`）

段階 6（TypeScript 移行）で発見（2026-09-18）。**移行前から存在する欠陥**です。

テンプレートの `:ref="elRef"` は Vue が ref を unwrap するため、**`elRef` に要素が入りません。**`elRef.value` は常に `null` です。

実害が出ていないのは、`resolveInvokerElement()` が先に `event.currentTarget` を見ており、invoker の解決がそちらで成立しているためです。**つまり `elRef` は死んだフォールバックです。**

段階 6 では、型エラーを避けるために `ref="elRef"` へ変えたところ、`dist` の比較で**コンパイル結果が変わる（文字列 ref になる）**ことが判明したため差し戻されています。潜在バグの修正は段階 6 の範囲外であり、正しい判断です。現在は `@vue-expect-error` で型エラーのみを抑止し、理由がコメントに残されています。

**対応結果:** 削除が選ばれました。`elRef` が生きる経路が存在しないことを確認したうえでの判断です。非 custom 時は handler が `<a>` のイベントからのみ呼ばれるため `event.currentTarget` が常に存在し、custom 時は `v-if="custom"` で `<a>` 自体が描画されません。コンパイル結果も `ref: elRef.value`（= 常に `null`）でした。

指示どおり `resolveInvokerElement()` のフォールバック分岐もあわせて削除され、1 引数の形になっています。`dist` 比較の差分は 3 ブロックすべてが死にコードの除去で、**フォールバック分岐を消しても出力が `null` のまま**であることが、分岐が死んでいたことの機械的な裏付けにもなっています。

`CHANGELOG` への記載は見送られました。**この判断は妥当です。**挙動が変わらない内部整理であり、AGENTS.md の記録対象は「挙動の変更」です。内部整理まで載せると変更履歴が薄まります。

---

### A-14. `useLayergeLink` の `bindings.ref` は生きている ✅ 実測により確認（2026-09-18）

A-13 の対応範囲は `LayergeLink.vue` のみでした。**`useLayergeLink.ts` には構造の似た `elRef` が残っています**（211-214 行、318 行、450 行）。

ただし**同じ欠陥とは限りません。**成立の仕組みが異なります。

| | `LayergeLink.vue`（A-13 で削除） | `useLayergeLink.ts`（本項目） |
|---|---|---|
| 書き方 | 自身のテンプレートで `:ref="elRef"` | `bindings` オブジェクトに `ref: elRef` を入れて返す |
| 適用者 | 自分 | **利用者**が `v-bind="bindings"` で展開する |
| 判定 | unwrap されて死亡（確認済み） | **未確認** |

`bindings.ref` は `index.d.ts:268` の `UseLayergeLinkBindings` で**公開 API として宣言されています。**機能していなければ、利用者は常に `null` の ref を受け取ることになります。

`useLayergeLink.ts:111` の `resolveInvokerElement(refEl, event)` は 2 引数のままで、`refEl` のフォールバック分岐が残っています。**A-13 と同じく、この分岐の生死はテストで判別できません。**`event.currentTarget` が先に成立するため、`elRef` が空でもテストは通ります。

#### 結論を出す前に実測してください

デモの `V2LinkDemoPage.vue` が `<button v-bind="linkA.bindings">` の形で実際に展開しているため、そこで確かめられます。

1. マウント後に `linkA.bindings.ref.value` を出力する
2. **`HTMLElement` が入っていれば機能している** → 分岐は生きているので残す。A-13 との違いを型かコメントに明記し、本項目は「確認済み・対応不要」として閉じる
3. **`null` のままなら A-13 と同じ死にコード** → 削除し、`resolveInvokerElement` を 1 引数に揃える。ただし**公開型 `UseLayergeLinkBindings.ref` の削除を伴うため、公開契約の変更にあたります。**5-1 の例外として扱い、CHANGELOG への記載が必要です

#### 実測結果: **選択肢 2（生きている・残す）**

デモに一時的な計測点を仕込み、2 通り測定しました（計測点は撤去済み）。

| 計測 | 結果 |
|---|---|
| マウント直後の `linkA.bindings.ref.value` | **`HTMLButtonElement`** — クリック前から要素が入っている |
| `linkA.handler.push()` を**イベント無し**で呼んだ後の invoker | **`{invokerTag: "BUTTON"}`** |

**2 件目が決定的です。**`event` を渡していないため `event.currentTarget` は存在せず、**`refEl` のフォールバック以外に解決経路がありません。**それでも invoker が登録されています。

#### A-13 との違い

| | `LayergeLink.vue`（A-13 / 削除） | `useLayergeLink.ts`（本項目 / 残置） |
|---|---|---|
| Ref を解決するのは | **テンプレートコンパイラ**。setup バインディング参照が unwrap され、常に `null` | **利用者の `v-bind="bindings"`**。Ref オブジェクトのまま vnode へ渡る |
| 結果 | 死亡 | **生存（実測）** |

同じ「`elRef` を ref に渡す」形でも、**誰が解決するかで結果が変わります。**この違いが 3 箇所（`elRef` 宣言、`resolveInvokerElement`、公開型 `UseLayergeLinkBindings.ref`）にコメントとして記録されました。コード変更は無く、`dist` はバイト単位で同一です。

> **A-13 の結果から A-14 を推測していたら、生きている公開 API を削除していました。**実測を求めた判断が正しく働いた事例です。

---

### B-7. E2E の不安定さ ✅ 原因特定・対処済み（2026-09-18）

`playwright.config.js` の `reuseExistingServer: !process.env.CI` により、ローカル実行では **4173 番に何が居ても再利用します。**

これが原因の偽失敗が、本セッション中に **2 回**発生しました。

| 発生 | 状況 |
|---|---|
| B-4（`0f9870c`）の直後 | B-2 のクリーンツリー検証で起動した dev サーバーが残留し、削除済みの一時ディレクトリを配信していた |
| 段階 6 の作業中 | 以前のバックグラウンド実行の dev サーバーが残留。実行のたびに別のテストが `net::ERR_CONNECTION_TIMED_OUT` で落ちた |

いずれも**アサーション失敗ではなく接続エラー**で、しかも毎回違うテストが落ちるため、原因の切り分けに時間を要しています。

#### 推奨: `reuseExistingServer: false` に固定する

本リポジトリは A-9 / A-10 で **「決定性を利便性より優先する」**という判断を既にしています（`lint:check` の検査範囲を揃え、`no-console` の環境依存を排除した）。**同じ原則を E2E にも適用するのが一貫しています。**

毎回 dev サーバーを起動する分だけ遅くなりますが、**偽の失敗を 2 回デバッグした時間のほうが既に高くついています。**

#### 3 回目の発生を受けて、推奨から必須に格上げします（2026-09-18）

A-14 の作業中に **3 回目**が発生しました。**コメントのみの変更で `dist` がバイト単位で同一**であるにもかかわらず、実行時間が 21 秒 → 43 秒 → 1.7 分と伸び、毎回異なるテストが `net::ERR_ABORTED` やタイムアウトで落ちています。マシンは CPU 0%・空きメモリ 14GB で、残留プロセスもありません。

**変更が原因ではあり得ない場面で、原因の切り分けに時間が費やされています。これで 3 回目です。**

**段階 7（型定義の生成への切り替え）は、ビルドと検証を何度も往復する作業です。**この状態のまま入ると、同じ調査を繰り返すことになります。**段階 7 の着手前に対処してください。**

対処の内容は実装側の裁量ですが、最低限 `reuseExistingServer: false` への固定は行ってください。残留サーバーの再利用は 3 回中 2 回で直接の原因でした。並列度（`workers`）の調整が有効なら、あわせて設定してください。

本リポジトリは A-9 / A-10 で**「決定性を利便性より優先する」**判断を既にしています。E2E だけ例外にする理由はありません。

---

#### 根本原因が数値で特定されました（2026-09-18）

3 回目の調査で、**「環境要因」で止まっていた原因が定量的に確定しました。**

```
TIME_WAIT の総数 : 16,266 件（うち 4173 番宛 12,566 件）
動的ポート範囲   : 49152 から 16,384 個
```

**エフェメラルポートの枯渇**です。ブラウザが発信用のローカルポートを確保できず `net::ERR_ADDRESS_IN_USE` になっていました。**サーバー自体は正常に起動しています。**短時間に全 58 テストを何度も走らせたことで、Windows の TIME_WAIT（約 4 分保持）が積み上がった結果です。

これで 3 回の発生がすべて説明できます。

| 回 | 直接の原因 |
|---|---|
| 1・2 回目 | **残留 dev サーバーの再利用**（`reuseExistingServer`） |
| 3 回目 | **エフェメラルポート枯渇**（連続実行）＋ 残留 Playwright プロセス 3 個の並行実行 |

#### 適用した設定（`playwright.config.js`）

```js
workers: 4,                 // 既定はコア数依存（22 コアで 11）
reuseExistingServer: false  // 4173 に居るものを再利用しない
```

`workers` を固定したのは、**マシン構成で結果が変わらないようにするため**です。配信側は単一の Vite dev サーバーなので、並列度を上げても接続数が増えるだけで待ち時間は縮みません。

#### 設定だけでは防げない部分（運用として守ること）

**3 回目の直接の引き金は設定ではなく、実行の仕方でした。**以下を守ってください。

- **全 58 テストの連続実行を繰り返さないこと。**反復中は対象スペックだけを走らせ、全実行は仕上げに 1 回で足ります
- **バックグラウンド実行を放置しないこと。**3 回目では、過去に起動した Playwright が 3 個生き残って同一ポートで並行実行されていました
- `ERR_ADDRESS_IN_USE` が出たら、**プロセスではなく TIME_WAIT を疑うこと。**ポートが LISTEN されていなくても枯渇は起こります。TIME_WAIT は約 4 分で解放されるため、**待てば直ります**

#### CI への影響はありません

CI はジョブごとに新しいランナーで動くため、TIME_WAIT の蓄積も残留プロセスも発生しません。**本項目はローカル開発のみの問題です。**CI 側に対処を入れる必要はありません。

#### あわせて観察: CI 条件でも 3 件が flaky

残留サーバーを停止したあと、CI 条件（`CI=true`）で **3 件がリトライ後に成功**しています。失敗 0・58 本緑ではありますが、**CI の `retries: 2` がこれを覆い隠します。**並列実行時の負荷起因と見られ、今のところ実害はありませんが、リトライ回数が増えるようなら並列度の調整を検討してください。

---

### A-15. `settled` の解決タイミングが名前・ドキュメントと一致していません 🔴

**2026-09-18 に、起動中のデモをブラウザから実測して発見しました。** 公開 API の意味論に関する論点なので、実装前に方針の決定が必要です。

#### 実測結果

デモ（`localhost:8080`）のルーターインスタンスに直接アクセスし、`handle.settled` と `handle.closed` の解決時刻を計測しました。

| 呼び出し | `settled` 解決 | 値 | 解決時の `depth` / `mode` | `closed` 解決 |
|---|---|---|---|---|
| `modal.open(Component)` | **2ms** | `{"status":"completed"}` | `1` / `presenter` | 700ms |
| `modal.push(Component, {url})` | **3ms** | `{"status":"completed"}` | `1` / `presenter` | （未計測） |
| `modal.push('/page-a')` | **4ms** | `{"status":"completed"}` | `1` / `presenter` | （未計測） |

計測は 3 通りとも、直前に `closeAll` で `depth=0` に戻し、`settled` が未解決であることを確認してから実施しています。解決後 1.2 秒間、presenter は開いたままでした。

`closed` は 700ms（実際に閉じた時点）で正しく解決しています。**`settled` だけが約 698ms 早く、開いた瞬間に解決しています。**

#### 実装は意図的です

`layerge/router/createLayergeRouter.ts:1773` にコメント付きで書かれています。

```ts
// v3.2: opt-in async の settled 対象は「確定（settled）」のみ
// - open/push/replace が commit された時点で completed とみなす
handle._resolveSettled({status: 'completed'});
```

失敗系は `cancelHandle`（同 2085 行）で `aborted` / `failed` / `superseded` を解決します。つまり `settled` の実際の意味は **「open/push/replace という操作そのものの結果」** であり、設計としては一貫しています。4 つのステータスもこの読み方で過不足なく説明できます。

#### では何が問題か

**名前とドキュメントが、この意味を伝えていません。** README の記述は次のとおりです。

```
| `closed`  | `Promise<void>`                  | Resolves when the entry has closed. |
| `settled` | `Promise<PresenterAsyncResult>`  | Resolves with the settled outcome only. |
```

`closed` の行が「閉じたときに解決する」と明示している直後に、`settled` が「settled outcome で解決する」とだけ書かれています。これは同語反復で情報がありません。この 2 行を並べて読んだ利用者は、`settled` を **`closed` の戻り値付き版**（閉じたときに、どう閉じたかを添えて解決する）だと理解します。`settled`（確定した・決着した）という語自体もその読みを強く後押しします。

この誤解は次のようなコードを生みます。

```js
const handle = router.modal.push(Editor, {url: '/edit'});
const result = await handle.settled;

if (result.status === 'completed') {
    refreshList();  // ユーザーが何もしていないのに、開いた直後に走ります
}
```

これは静かに壊れます。例外も警告も出ず、`completed` という「成功したように見える値」が返るためです。

#### 決めていただきたいこと

1.0.0 は未公開なので、**いま決めれば破壊的変更になりません。** 公開後は名前も意味も凍結されます。

- **案 1: 名前を変える。** 意味論は現状のまま、`settled` を操作結果だと分かる名前（`opened` / `result` / `committed` など）に改名する。実装変更は最小。
- **案 2: ドキュメントだけ直す。** 名前は据え置き、README に「open/push/replace の操作結果であり、presenter が閉じた時点ではない」と明記し、`closed` との違いを例示する。
- **案 3: 意味論を変える。** `settled` を閉じた時点の結果に変更する。設計・テスト・E2E への影響が最も大きい。

いずれの案でも、**「presenter が閉じたときに、どう閉じたかを知る」公開 API が現在は存在しません**（`closed` は `Promise<void>` で値を返しません）。案 3 を採らない場合、この用途をどう満たすかを併せて決める必要があります。

#### A-11 との関係

A-11 は `settled` が失敗系で**不正な形**で解決する不具合でした。本項は成功系が**不正なタイミング**で解決する（ように読める）問題です。同じ API の別の側面であり、A-11 の修正は本項に影響しません。

---

### A-16. vue-router の非推奨 API `next()` を使用しています ✅ 対応済み（2026-09-18 / `1e7bb44`）

デモをブラウザで開いた時点で、コンソールに次の警告が出ます。

```
[Vue Router warn]: The `next()` callback in navigation guards is deprecated.
Return the value instead of calling `next(value)`.
```

発生源はデモではなく **ライブラリ本体** です。`layerge/router/createLayergeRouter.ts:2774` の `router.beforeEach((to, from, next) => {...})` で、`next()` を 6 箇所で呼んでいます（2783 / 2791 / 2797 / 2804 / 2820 / 2827 行）。

#### なぜ公開前に直すべきか

`package.json` は `vue-router: ^4.2.0 || ^5.0.0` を宣言しています。vue-router 5 の利用者は、**Layerge を入れた瞬間から、ナビゲーションのたびにこの警告を見ることになります。** しかも警告文に出るのは `[Vue Router warn]` であって Layerge の名前ではないため、利用者は自分のコードを疑って時間を溶かします。

さらに、非推奨は将来の削除を意味します。vue-router 6 で `next()` が外れた時点で Layerge は動かなくなります。

#### 修正は機械的です

当該ガードは**完全に同期**で、`next()` の呼び出しはすべて直後に `return` が続くか、関数の末尾です。したがって次の置換で等価になります。

```
next(false); return;  ->  return false;
next(); return;       ->  return;
next();  （末尾）      ->  （削除、または return;）
```

あわせて引数から `next` を落とし、`router.beforeEach((to, from) => {...})` にします。

vue-router 4 は 4.0 から値の return に対応しているため、宣言している peer 範囲の両方で動作します。

#### 受け入れ条件

- デモをブラウザで開き、コンソールに `next()` の非推奨警告が出ないこと
- unit / E2E がすべて緑であること（ガードの分岐は 6 経路あります。`next(false)` による**中断**が維持されているかを特に確認してください）
- `dist` を修正前後で比較し、差分が `next` の除去に対応するものだけであること

---

#### 対応結果（`1e7bb44`）

ソースを確認しました。`(to, from, next)` → `(to)`、`next(false); return;` → `return false;`、`next(); return;` → `return;`、末尾の `next();` は削除。**指示どおりの機械的置換で、余計な変更はありません。** ライブラリ内の `next(` は 0 件。

E2E で `reason="aborted (guard returned false)"` が観測されており、`return false` による中断が実際に効いている直接の証拠が取れています。検証 b は達成です。

`dist` で「条件 2 つが 1 つに併合された」件も確認しました。ソース側では `isModalPending` が両方の `if` より**前**で `const` に代入されているため、バンドラが `if (A) return; if (B) return;` を `if (A || B) return;` に併合しても、`$layerge.pending` の読み取り回数・順序は変わりません。**等価です。**

#### 記録すべき教訓: 単体テストは vue-router を見ていませんでした

この変更で単体テストが 19 件落ちました。原因はライブラリではなく `tests/_helpers/fakeRouter.js` で、**`next()` 形式しか実装していなかった**ためです。

つまり移行前の単体テスト 36 件は、vue-router の契約ではなく「vue-router を模した自作オブジェクトの契約」に対して緑だったことになります。非推奨 API しか実装していない疑似ルーターに対して緑であり続けたので、**`next()` が非推奨であるという事実そのものを単体テストは検知できませんでした。**

これは A-11 と同じ構図です。A-11 では「`settled` の値」ではなく「コンソールのログ行」を検証していたために不正な値が通り抜けました。今回は「実物のルーター」ではなく「模造品」を検証していたために非推奨 API が通り抜けました。いずれも、**assert している対象が、保証したい対象とずれている**という一つの型です。

ここから導かれる運用上の結論:

- **vue-router の契約に関わる変更は、単体テストが緑でも根拠になりません。** 実物の vue-router に触れているのは E2E だけです。今回 Code が検証 b を E2E で実施したのは正しい判断でした。
- `fakeRouter.js` の忠実度は、いまや 36 件の単体テストの土台になっている**検証されていない前提**です。乖離すれば単体は緑のままライブラリが壊れます。
- 現在の `fakeRouter` には既知の未対応が 2 点あります。ガードが Promise を返した場合（実物は await するが、疑似は `next(promise)` を渡す）と、`true` を返した場合です。**いまのガードは同期で `false` / `undefined` しか返さないため実害はありません**が、将来ガードを非同期化する場合はここが先に壊れます。着手する人への申し送りとして残します。

---

### A-17. 公開ハンドルに内部メンバーが実行時に露出しています 🟡

デモ上で `modal.open()` の戻り値を `Object.keys()` で列挙した結果です。

```
["_id", "_resolveSettled", "_resolveClosed", "_setActive", "close", "closed", "settled", "isActive"]
```

`_resolveSettled` / `_resolveClosed` / `_setActive` は、Layerge の内部状態を書き換えるための関数です。利用者が

```js
handle._resolveSettled({status: 'completed'});
```

を呼べば、実際には確定していない結果で `settled` を解決できます。`_setActive(true)` で閉じたハンドルを生き返らせることもできます。

#### 移行仕様 §6-4 の決定では塞がりません

§6-4 で `stripInternal` を適用する決定をしました。これにより `.d.ts` からは消えます。しかし `stripInternal` は**型定義からの除去であって、実行時の除去ではありません**。結果として、

- 型の上では「存在しない」
- 実行時には「存在し、呼べる」

という食い違いが生じています。TypeScript 利用者は `handle._resolveSettled` を書けませんが、JavaScript 利用者は書けますし、`as any` を通せば誰でも書けます。

#### 検討していただきたい対応

公開ハンドルと内部ハンドルを分離し、`modal.open` / `push` / `replace` が返すオブジェクトには `close` / `closed` / `settled` / `isActive` のみを持たせる方法があります。内部ハンドルは `$layerge.stack` のエントリ側だけが保持します。

優先度を A の中では 🟡 としたのは、これが**誤用したときだけ壊れる**問題であり、A-15 / A-16 のように**正しく使っていても影響を受ける**問題ではないためです。ただし 1.0.0 で公開すると、ハンドルの形は以後の互換性の対象になります。

### A-18. 未公開のまま非推奨エイリアス `fakePath` を出荷しようとしています ✅ 対応済み（2026-09-19 / `989757a`）
#### 対応結果（`989757a`）— Cowork 側で検証済み

単体テストは **36 件のまま**で、`{fakePath}` → `{url}` の書き換えが 5 箇所。指示した罠（`tests/v3x_async_api.test.js` は 4 件中 3 件が `fakePath` を使っており、削除すると pushAsync と supersede の被覆が消える）を Code が正しく回避しています。

警告文は `open() ignores url.` になり、**ライブラリの実行時メッセージからバージョン表記が 0 件**になりました。`url` 側の警告 2 種は保持されています。

#### 記録: `allowUnmatched` の非対称（Code からの報告・対応不要）

`allowUnmatched` は `typeof url === 'string'` のみを見るため、`url` に `RouteLocationRaw` を渡した場合は `false` になります。つまり `push(Component, {url: {query: {...}}})` で未マッチ URL を指す経路は許容されません。

ただし `RouteLocationRaw` 形は現在ルートの query / hash 差し替えとして解決されるため、未マッチになる経路が実際には生じません。**実害なし**と判断します。今回の範囲外として触らなかった Code の判断は正しいです。将来 `url` の `RouteLocationRaw` 形で任意パスを指せるようにする場合は、ここが先に問題になります。

#### 記録: 履歴文書の扱い（Code の判断・妥当）

`CHANGELOG.md` の過去節と `docs/internal/spec-typescript-migration.ja.md` の記述を書き換えず、前者には Unreleased の `### Removed` を、後者には失効注記を追加した判断は妥当です。**完了した契約書を後から書き換えると、当時何を決めたのかが追えなくなります。** 本書（roadmap）を対象外としたのと同じ理由です。そのままにしてください。

なお `CHANGELOG.md` 自体には別の問題があります（A-20）。



`fakePath` はライブラリ本体に完全に実装されたまま残っています（`types.ts:45` の型定義、`createLayergeRouter.ts:2016` 以降の実行時処理、`tests/` の単体テスト 2 ファイル）。README の公開 API 表にはこう書かれています。

```
| `fakePath` | `string` | push / replace | **Deprecated since v3.0** — use `url`. Still accepted for compatibility. |
```

#### なぜ問題か

**このパッケージは一度も公開されていません。** `package.json` の version は `1.0.0` です。したがって、

- **「Deprecated since v3.0」という記述が成立しません。** npm で 1.0.0 を見ている人に対して「v3.0 で非推奨になった」と書いてあります。公開時系列に v3.0 は存在しません。これは C-1（バージョン表記の混在）が、**利用者向けドキュメントの中で最も読まれる API 表**に残っていた、ということです。デモからは一掃しましたが、ここが残っていました。
- **「Still accepted for compatibility」の互換対象が存在しません。** 既存利用者がいないので、互換性を保つ相手がいません。1.0.0 で初めて触れる人は `url` しか知りません。
- **1.0.0 で出せば、`fakePath` は semver の保護対象になります。** 後から外すにはメジャーバンプが必要です。いま落とせばコストはゼロです。

#### 決めていただきたいこと

社内などに `fakePath` を使っている既存の利用箇所があるかどうかだけが判断材料です。

- **無い場合（推奨）**: 公開前に完全に削除します。型定義・実行時処理・単体テスト・README の該当行。API 表から 1 行減り、「v3.0」という説明のつかない記述も消えます。
- **ある場合**: 残しますが、README の記述を書き換える必要があります。「Deprecated since v3.0」ではなく「Deprecated alias for `url`; kept for pre-release internal users and scheduled for removal in 2.0.0」のように、**公開時系列と整合する言い方**にします。

A-15 と同じ性質の論点です。公開した瞬間に凍結され、後から直すには破壊的変更が要ります。

### A-19. 出荷する型定義が `moduleResolution: node16` / `nodenext` の ESM 利用者に解決されません 🔴

**2026-09-19 に Cowork が実測して発見しました。** `tsc` は純 JS で動くため、Cowork の環境でも実行できます（vite / vitest / Playwright とは異なります）。

#### 症状

`dist/types` を実際の利用者として型検査した結果です。プローブは公開 API 9 個を import するだけの `.ts` ファイルです。

| 利用者の設定 | 結果 |
|---|---|
| `moduleResolution: "bundler"`（Vite / webpack） | ✅ エラー 0 件 |
| `moduleResolution: "bundler"` + `skipLibCheck: false` | ✅ エラー 0 件（出荷する `.d.ts` 自体も健全） |
| `moduleResolution: "node16"` + CJS（`require` 条件 → `.d.cts`） | ✅ エラー 0 件 |
| **`moduleResolution: "node16"` + ESM（`import` 条件 → `.d.ts`）** | ❌ **公開 API がすべて「存在しない」** |

失敗時のエラーは次のとおりです。

```
error TS2724: '"layerge"' has no exported member named 'createLayergeRouter'. Did you mean 'LayergeRouter'?
error TS2305: Module '"layerge"' has no exported member 'useLayerge'.
error TS2305: Module '"layerge"' has no exported member 'usePresenter'.
error TS2724: '"layerge"' has no exported member named 'useLayergeLink'. Did you mean 'LayergeLink'?
error TS2305: Module '"layerge"' has no exported member 'usePresenterBindings'.
```

**型だけの export（`LayergeRouter` など）は解決され、実行時 API が丸ごと消えます。** 利用者から見ると「型定義が壊れているパッケージ」そのものです。

なお、検査が実際に機能していることは negative control で確認済みです（存在しない export を import すると TS2305 が出ます）。exit=0 は「何も検査していない」ではありません。

#### 原因

出荷する `.d.ts` の相対 specifier に**拡張子がありません**。

```ts
// dist/types/index.d.ts
export * from './router/createLayergeRouter';   // ← 拡張子なし
export * from './composables/usePresenter';
```

Node16 / NodeNext の **ESM 解決では、相対 specifier に明示的な拡張子が必須**です。CJS 解決は拡張子なしを許容するため `.d.cts` 側は通り、bundler 解決も許容するため Vite 利用者は通ります。**壊れるのは ESM × node16 の組み合わせだけ**ですが、これは現在のアプリで最も標準的な設定です。

該当は `dist/types` 全体で **20 ファイル・32 箇所**（`index.d.ts` / `index.d.cts` が各 7、他は各 1）。元を辿ると TypeScript ソース側の相対 import が拡張子なしで書かれており、`vue-tsc` がそれをそのまま `.d.ts` に出力しています。

#### 修正が有効であることは検証済みです

`dist/types/index.d.ts` の相対 specifier に `.js` を付けた fixture を作り、同じ node16 ESM プローブを実行したところ、**エラーが 0 件になりました**（`.vue` の import は拡張子を付けずとも解決します）。

推奨する修正は、ソース側の相対 import に `.js` 拡張子を付けることです（TypeScript が ESM ライブラリに対して公式に推奨している書き方で、`.ts` ソースに `.js` と書きます）。`vue-tsc` と Vite の双方がこの規約を解釈します。出力を後処理する案もありますが、ソースを正すほうが原理的で、`emit-cts-types.mjs` に分岐を増やさずに済みます。

#### なぜ CI をすり抜けたのか（重要）

**consumer マトリクスの 2 つは TypeScript を使っていません。** どちらも `vite build` のみ、devDependencies は `@vitejs/plugin-vue` と `vite` だけで、`.ts` ファイルは 0 件です。

したがって `pack-and-consumers` ジョブが検証しているのは `index.mjs` / `index.cjs` の**実行時解決**であって、型定義の解決ではありません。B-5 は `.d.ts` と `.d.cts` が**互いに同一**であることを検証しましたが、同一であることと利用可能であることは別です。`vue-tsc --noEmit` はソースを検査しますが、`stripInternal` を含む emit 後の成果物は検査しません。

つまり、**B-1（TypeScript 全面移行）の成果物そのものが、CI で一度も利用者視点の検証を受けていませんでした。** 移行仕様書 §6-3 は consumer を「型解決の検証」と書いていますが、実態は JS のみです（この食い違いは Code が報告してくれました）。

これは A-11・A-16 と同じ型の漏れです。**assert している対象が、保証したい対象とずれている。** 3 回目です。

#### 受け入れ条件

1. ソースの相対 import に `.js` 拡張子を付け、`dist/types` の拡張子なし相対 specifier を **32 箇所 → 0 箇所**にする
2. **TypeScript の consumer を CI に追加する。** 既存 2 つに並べる 3 つ目として、`moduleResolution: "nodenext"`、`"type": "module"`、`skipLibCheck: false` で `tsc --noEmit` を実行し、公開 API を import するだけのファイルを型検査する。**これが本項の本質的な対処です。**（1 だけでは、次に同じ形で壊れたときにまた誰も気づきません）
3. 既存の検証（lint / typecheck / 単体 / E2E / verify-pack / smoke-dist / 既存 consumer）がすべて緑

#### 再現手順（Cowork が実施したもの）

```
mkdir -p ~/probe/src ~/probe/node_modules
ln -s <repo> ~/probe/node_modules/layerge
ln -s <repo>/node_modules/{vue,vue-router,@vue} ~/probe/node_modules/
# ~/probe/package.json に {"type":"module"}
# tsconfig: module/moduleResolution = node16, strict, noEmit, types: []
node <repo>/node_modules/typescript/bin/tsc -p tsconfig.json
```

---

### A-20. CHANGELOG が、未公開のパッケージに公開済みの体裁を与えています 🟡

現状の見出し構成です。

```
## Unreleased
## 1.0.0 (2026-05-28)
## Pre-public milestone 1.1.0 (2026-01-05)
```

`package.json` の version は `1.0.0` で、**まだ一度も公開されていません**。それにもかかわらず 1.0.0 が日付つきのリリースとして記載されています。npm でこのパッケージを見る人にとって、公開日は「今日」であり 2026-05-28 ではありません。

さらに、1.0.0（5 月）の下に 1.1.0（1 月）が並んでいます。番号は大きいのに日付は前です。上から読んだ人は順序を理解できません。1.1.0 には「Pre-public milestone」というラベルが付いており、**内部の開発フェーズ番号であって semver ではないこと**が明示されています。同じ配慮が 1.0.0 には及んでいません。

これは A-18 と同根です。公開時系列に存在しないバージョンが、利用者が読む場所に残っています。

#### 検討していただきたい整理

公開前の現時点では、`Unreleased` と `1.0.0` の内容は**すべて初回リリースの一部**です。したがって公開時に 1 つの `## 1.0.0` に畳み、日付を実際の公開日にするのが自然です。`Pre-public milestone 1.1.0` は、開発経緯の記録として残す価値があるなら現在のラベルのまま末尾に置けば、semver と誤読されません。

A-4（`package.json` のメタデータ）と同じく公開直前に確定させる種類の項目なので、着手のタイミングはあなたの判断に委ねます。

## 優先度 B — 公開直後に着手すべきもの

### B-1. TypeScript への全面移行 ✅ 完了（2026-09-18）

**仕様書を作成済みです: [spec-typescript-migration.ja.md](./spec-typescript-migration.ja.md)**

確定した方針は次のとおりです。理由と却下した代替案は仕様書に記載しています。

| 論点 | 決定 |
|---|---|
| 公開との順序 | **`1.0.0` 公開の前に移行を完了させる**（型が厳密になることで利用者側に型エラーが出るため、公開前に済ませる） |
| 移行の粒度 | **内側から段階的**（`createLayergeRouter.js` が単体 2,731 行＝全体の 62% を占め、一括では差分がレビュー不能になるため） |
| 型定義 | **ビルド生成に一本化**し、手書き 2 ファイルを廃止 |

この決定により、**本項目は優先度 B ではなく公開前必須（優先度 A 相当）に変わりました。**公開までの期間は伸びます。

移行の前提として **A-6（デッドコード削除）を先に済ませてください。**同名ファイルが残ったまま段階 5 に入ると取り違えが起きます。→ 完了済み。

#### 進捗

| 段階 | 状態 |
|---|---|
| 段階 0 基盤整備 | ✅ 完了（`96a80df`。ソース無変更を確認済み） |
| 積み残し（`typecheck` + CI） | ✅ 完了（`c7c69d1`） |
| 段階 1 `types.ts` | ✅ 完了（`7d37b63`。型名 28→28、追加・削除ゼロを機械照合で確認） |
| 段階 2 `internals/` | ✅ 完了（`25c299e`。公開面に漏れていないことを dist で確認済み） |
| 段階 3 `core/` | ✅ 完了（`5c29368`。`_kept` の型是正を含む。実装は無変更） |
| 段階 4 `composables/` | ✅ 完了（`91626f3`。5 ファイル、`useLayergeLink` は 447 行） |
| 段階 4-b `noopHandle` 是正 | ✅ 完了（`b2dbdec`。単体テスト 3 件と CHANGELOG を含む） |
| 段階 5-a `types.ts` に A 分類 4 型 | ✅ 完了（`ab83e96`。**ジェネリック維持は決着。**5 型を `index.d.ts` と機械照合し全件一致、Cowork 側でも独立に照合済み） |
| 段階 5-b `createLayergeRouter.ts` | ✅ 完了（`42aa9e7`。`any` ゼロ。`dist` 構造比較で挙動変化 3 件を検出・差し戻し） |
| A-11 の是正 | ✅ 完了（`664eeab`） |
| 段階 6 `.vue` | ✅ 完了（`c06635a`。3 ファイル。props は `PropType` 形式で runtime 宣言を保持） |
| A-12 / A-13 | ✅ 完了（`b35b069` / `258742e`） |
| 段階 7 型定義の生成へ切替 | ✅ 完了（`79375a3`。**台帳全項目が決着し、契約変更ゼロ。**6-4 も決定・適用済み） |
| 段階 8 仕上げ | ✅ 完了（`9bfc57c`。`allowJs` 除去・README 更新・`strict` 引き上げ） |
| JSDoc / コーディング規約の再定義 | ✅ 完了（Cowork 担当分） |

**B-1 TypeScript 全面移行は全 8 段階が完了しました。**

> **`layerge/` 配下に残る `.js` は `index.js` のみです。**
> 各段階の完了条件は `pnpm typecheck` / `pnpm lint:check` / `pnpm test` / E2E の 4 つです（仕様書 第 4 章）。

未解決の懸念（`strict` をどこまで貫けるか、生成型と手書き型の差分判定、`PresenterTarget` の型ガード、内部メンバーの露出）は仕様書の第 6 章に記載しています。**実装中にそこで詰まった場合は、判断せずに相談してください。**

---

### B-2. CI の設置 ✅ 対応済み（2026-09-17）

コミット `9fd3baf`。`.github/workflows/ci.yml`（3 ジョブ）と `scripts/verify-pack.mjs` を追加。`pull_request` と `main` への push で実行されます。

| ジョブ | 内容 |
|---|---|
| `lint-and-test` | `pnpm lint:check` / `pnpm test` / `pnpm build` |
| `e2e` | Playwright。失敗時に `test-results/` を artifact 保存 |
| `pack-and-consumers` | `pnpm build` → 公開物検証 → `npm pack` → consumer-4 / -5 を matrix で install + build |

Node は `engines` の下限である 20。`concurrency` で同一 ref の古い実行を打ち切ります。

**検証方法が堅実です。** `node_modules` も `dist` も tarball も無いツリーを `git archive` で作り、3 ジョブすべてを通しで実行して確認されています。CI 設定は「書いたが動くか分からない」が最も起きやすい領域なので、この確認は価値があります。

`scripts/verify-pack.mjs` は当方でも実行し、8 ファイルで OK になることを確認しました。`EXPECTED_FILES` は `package.json` の `files` と整合しています。

#### 実装中に判明した pnpm の挙動（記録）

- **`cd consumer-… && pnpm install` は consumer をインストールしません。**pnpm が親を辿ってワークスペース（root + demo）を対象にするため、`--ignore-workspace` が必須です
- **consumer で `--frozen-lockfile` は必ず失敗します。**lockfile に tarball の integrity が焼き込まれており、ソースが変われば `npm pack` の結果も変わるためです（`ERR_PNPM_TARBALL_INTEGRITY`）。`--no-frozen-lockfile` を使用。lockfile は `vue` / `vue-router` / `vite` の固定には引き続き効いています

#### 前提

CI プラットフォームは **GitHub Actions** を前提としています。公開先は A-4 で検討中ですが、別ホストにする場合もジョブの中身（コマンド列）はそのまま移せます。README の CI バッジは A-4 の決定後に追加するのが自然です。

---

### B-3. consumer の tarball 参照 ✅ 対応済み（2026-09-18）

コミット `b1133fc`。推奨案の 2（固定名へのリネーム）が採用されました。

`scripts/pack-for-consumers.mjs` が `npm pack --json` の返すファイル名を読み、`layerge.tgz` へ改名します。consumer 2 件の依存は `file:../layerge.tgz` になり、lockfile も再生成済みです。

**時限爆弾が解除されたことが実測されています。**`package.json` を一時的に `1.0.1` へ上げ、生成物が `layerge-1.0.1.tgz` になっても consumer の install と build が成功することを確認したうえで `1.0.0` へ戻されました。

---

### B-4. `dist` の実行時スモークテスト ✅ 対応済み（2026-09-18）

コミット `0f9870c`。`scripts/smoke-dist.mjs` を追加し、`pack-and-consumers` ジョブで実行します。`dist/index.mjs`（ESM）と `dist/index.cjs`（CJS）を実際に読み込み、公開エクスポート 9 個が取得できることを確認します。

**検出できることが 2 通りで確認されています。**ESM から `usePresenterLeaveGuard` の export を落とした場合と、`dist/` を丸ごと欠損させた場合の双方で exit 1 になります。

当方でも実行し、`[smoke-dist] OK: ESM / CJS ともに公開エクスポート 9 個を確認` を得ています。

---

### B-5. 型定義 2 ファイルの同一性 ✅ 対応済み（2026-09-18）

コミット `2af0004`。`lint-and-test` ジョブに `cmp` による比較を追加。不一致なら GitHub アノテーションと `diff` を出して落とします。`index.d.cts` に 1 行足した状態で exit 1 になることが確認されています。

**B-1 段階 7 で手書きの型定義が廃止されるまでの暫定措置**である旨がコメントに残されていました。

#### ✅ 役割を終えました（2026-09-18 / 段階 7 / `79375a3`）

手書きの `index.d.ts` / `index.d.cts` は削除され、型定義は `vue-tsc` の生成物と、その `.d.cts` への複製で供給されるようになりました。**同一性はビルド手順が保証するため、CI の `cmp` チェックは不要になり、段階 7 で外されています。**

---

### 付記: B-4 のコミット時に E2E が 1 度赤になった件（調査済み）

B-4 のコミット時、E2E が 1 度赤になり、その結果を待たずにコミットが進みました（実装側から自己申告あり）。

**コードに起因しないことが構造的に確定しています。**コミット `0f9870c` が変更したのは `.github/workflows/ci.yml` と `scripts/smoke-dist.mjs` の 2 ファイルのみで、`layerge/` にも `demo/` にも `e2e/` にも一切触れていません。**E2E の結果に影響し得る変更が含まれていません。**

原因は、直前の B-2 検証で起動した vite dev サーバーが 4173 番に残存し、`playwright.config.js` の `reuseExistingServer: !process.env.CI` によって、削除済みの一時ディレクトリを配信するサーバーに対してテストが走ったため、と説明されています。設定を確認したところ整合しており、**CI では `CI` 環境変数が立つため `reuseExistingServer` は false になり、この経路は発生しません**（加えて CI は `retries: 2`）。

その後 3 回連続で 58 テスト passed、現在 4173 番は LISTEN されていないことも確認済みです。

---

### B-8. `strictNullChecks` が false のまま 🟡

段階 8 で `strict` を 1 フラグずつ引き上げた結果、**8 フラグ中 6 つが true** になりました。

| 状態 | フラグ |
|---|---|
| **true** | `noImplicitAny` / `noImplicitThis` / `strictBindCallApply` / `strictFunctionTypes` / `useUnknownInCatchVariables` / `alwaysStrict` |
| **false** | `strictNullChecks` / `strictPropertyInitialization`（前者に依存するため単独では有効化不可） |

`strictNullChecks` を有効化すると 28 件のエラーが出ます。**うち 13 件は vue-router の型モデル差**が根です。

```
Type 'RouteRecordNameGeneric | null' is not assignable to type 'RouteRecordNameGeneric'.
```

`router.resolve()` が返す `RouteLocationResolved` は `name` が `null` を取り得ますが、公開型が使う `RouteLocationNormalizedLoaded` は取りません。

解消には次のいずれかが必要です。

1. **公開型 `PresenterEntry.route` を変更する** → 契約変更にあたる
2. **13 箇所をキャストする** → 型モデルの差を隠すことになる

残る 15 件は通常の null 処理で対処可能ですが、**フラグは all-or-nothing** のため、13 件を片付けない限り有効化できません。

**公開型を変える判断を含むため、移行の仕上げの範囲を超えると判断して見送られました。**受け入れ条件 9 に従い、理由は [spec-typescript-migration.ja.md](./spec-typescript-migration.ja.md) の 6-1 に記録済みです。

**公開の可否には影響しません。**着手する場合は、選択肢 1 を採るなら次のメジャー／マイナーバージョンで、選択肢 2 を採るならキャストの理由を各所にコメントで残してください。

---

### B-6. consumer lockfile の扱い 🟢

consumer の lockfile は tarball の integrity を含むため、ソースが変わるたびに古くなります（B-2 で `--no-frozen-lockfile` を使う理由）。git 管理から外す選択肢もありますが、その場合 `vue` / `vue-router` / `vite` の固定が失われます。**現状維持で実害はありません。**判断が必要になったときのための記録です。

---

## 優先度 C — 継続的に整えるもの

### C-4. 公開前のリポジトリ整理 ✅ 完了（2026-09-18 / `455e1fd`）

2026-09-18 に棚卸しを実施しました。**未追跡かつ未無視のファイルはゼロ**で、`dist/` / `layerge.tgz` / `test-results/` はすべて `.gitignore` 済みです。以下は追跡されているファイルに関する指摘です。

#### 削除を推奨するもの

| 対象 | 理由 |
|---|---|
| **`MIGRATION_v1x.md`** | 「v1.1.0 から新しい v1.x への移行ガイド」ですが、**このパッケージは一度も公開されていません。**世に存在しないバージョン間の移行を説明しており、利用者を確実に混乱させます。内容は `CHANGELOG.md` と README でカバー済みです |
| **`V1X_NOTES.md`** | 冒頭で自ら "(internal)" と名乗っています。内容は `docs/design_notes.md` と `CHANGELOG.md` に重複しており、**リポジトリ直下という最も目立つ場所**にあります |
| **`.browserslistrc`** | **参照している設定も、利用する依存も存在しません**（`autoprefixer` / `postcss-preset-env` / `@babel/preset-env` いずれも未インストール、postcss 設定ファイルも無し）。ビルドターゲットは `tsconfig.json` の `target: ES2022` が決めています |

#### `.browserslistrc` の削除は検証済みです

Cowork が「比較してから消す」と書いておきながら未検証のまま削除したため、Code 側で検証を依頼しました。**結果は問題なし**です。

| | `index.mjs` | `index.cjs` |
|---|---|---|
| `.browserslistrc` なし | 48,245 bytes | 36,800 bytes |
| `.browserslistrc` あり（git 履歴から復元） | 48,245 bytes | 36,800 bytes |
| 比較 | **バイト単位で同一** | **バイト単位で同一** |

#### 移動は 3 件とも名前変更として追跡されています

`outcome-and-tracing.md`（R083）/ `roadmap.ja.md`（R082）/ `spec-typescript-migration.ja.md`（R099）。履歴が保たれています。

#### Cowork の検証ツールの盲点（記録）

Code が `AGENTS.md:15` の不整合を発見しました。**リンクの href は新パスへ更新済みだったのに、表示テキストが旧パスのまま**でした。

Cowork のリンク検証スクリプトは**リンク先が解決するかだけを見ており、表示テキストが実態と一致しているかを見ていません。**リンクとしては機能するため、検証は通ってしまいます。**今後パス変更を伴う整理を行う際は、表示テキストも突き合わせてください。**

#### 内容を精査したうえでの処置

当初は「`internal/` へ移動」としていましたが、**中身を読んだ結果、統合・削除に方針を変えました。**6 件のうち利用者向けの有用な情報が埋もれていたためです。

| 旧ファイル | 処置 | 理由 |
|---|---|---|
| `v4.0-spec.md` | → **`internal/outcome-and-tracing.md`** へ改名・移動 | 内部 Outcome モデル・DecisionTrace・環境サポート契約・リーク不変条件は**他に無い保守者向け知識**。版番号を外し、本文中の `v4.0` / `v3.x` という版フェーズ呼称も除去 |
| `v3.0.md` | **削除** | 内容は README の Public API に統合済み。**離脱ガードの記述は削除済みコード（A-6）を説明しており誤りを含んでいました** |
| `v2/usage.md` | **削除**（README へ統合） | Forward 復元が push 限定、`opened` と `entered` の違い、`provide` 不要の 3 点が **README に欠けていました**。追記済み |
| `v2/plan.md` | **削除** | 完了済みの PR 計画 |
| `migration_v2_to_v3.md` | **削除** | 未公開バージョン間の移行ガイド |
| `v1x-headless-and-transition.md` | **削除**（design_notes へ統合） | 公開エントリ状態から `zIndex` / `mode` / `reason` / `stackVisible` を外した理由、描画対象ルール、hook 合成の例外安全性を追記 |

#### README の是正（統合作業中に発見）

| 是正 | 内容 |
|---|---|
| **「v2 (out of scope)」節が事実と異なっていた** | 「Invoker / trigger model」「Link extensions」を**未実装**と書いていましたが、`<LayergeLink>` / `useLayergeLink` は公開済み、invoker も実装済みです。**公開直前のパッケージが、出荷している機能を「無い」と説明していました。**「Not provided」節へ置き換え |
| 環境サポート表を追加 | SSR は対象外、マルチタブは未定義、という**契約**が README のどこにもありませんでした |
| Debugging 節を拡充 | DecisionTrace の有効化方法と出力レベル。利用者が使える機能なのに内部資料にしか記載がありませんでした |
| 見出しの版接尾辞を除去 | `(v1.x)` / `(v1)` は設計フェーズの呼称で、公開バージョン `1.0.0` と紛らわしいため |

#### 移動したもの

**`docs/internal/` を新設し、現役でない資料をそこへ集約してください。**`git mv` で履歴を保ってください。

| 移動元 | 種別 |
|---|---|
| `docs/v2/plan.md` / `docs/v2/usage.md` | 設計フェーズ資料 |
| `docs/v3.0.md` / `docs/v4.0-spec.md` | 同上 |
| `docs/migration_v2_to_v3.md` | 同上 |
| `docs/v1x-headless-and-transition.md` | 同上 |
| `docs/spec-typescript-migration.ja.md` | **移行完了により履歴資料へ** |
| `docs/roadmap.ja.md` | 内部の課題管理。公開物ではありません |

整理後の `docs/` は **13 ファイル → 8 ファイル**になりました。相対リンク 58 本がすべて解決することを確認済みです。

```
docs/
  README.md          索引
  motivation.ja.md   目的と解決したい課題
  design_notes.md    設計判断
  guidelines/        コーディング規約・JSDoc 規約
  internal/          設計フェーズ資料・移行仕様書・課題管理
```

参照の更新も実施済みです（`docs/README.md` は索引として全面改稿、`AGENTS.md` と `motivation.ja.md` の参照先を補正、移動したファイル内部の相対深さも補正）。

> **これで C-1（バージョン表記の混在）も解消します。**`v2` / `v3` / `v4` の命名が `internal/` の下に入り、「これらは npm のバージョンではない」という警告の説得力が増します。

#### 任意（判断はお任せします）

`consumer-vue-router-4` / `consumer-vue-router-5` をリポジトリ直下から `consumers/vue-router-4` / `consumers/vue-router-5` へ移すと、ルートが片付きます。ただし **CI のジョブ定義（matrix のパス）と、`package.json` の `file:../layerge.tgz` を `file:../../layerge.tgz` に直す**必要があります。効果は見た目の整理に留まるため、**優先度は低い**です。

#### 変更しないほうがよいもの

- **設定ファイルが `.js` のままであること。**ソースは TypeScript になりましたが、`vite.config.js` や `eslint.config.js` を `.ts` 化する利点はなく、ツールによっては扱いが不安定です。**一貫性のために直す必要はありません**
- `dist/` / `layerge.tgz` / `test-results/` が物理的に存在すること。すべて `.gitignore` 済みで、公開物には影響しません

---

### C-1. バージョン表記の混在 ✅ C-4 により解消（2026-09-18）

`docs/` 配下には `v2/`、`v3.0.md`、`v4.0-spec.md`、`migration_v2_to_v3.md` があり、README 本文にも `v1.x` / `v2` / `v3.2` の表記が混在しています。

一方、npm 上の公開バージョンは `1.0.0` です。**これらの資料が指す機能はすでに `1.0.0` に含まれています。**

外部の読者は `v4.0-spec.md` を「将来のバージョン 4.0 の仕様」と解釈しますが、実際には過去の設計フェーズの呼称です。公開リポジトリでは確実に誤解を招きます。

**対応方針:** [docs/README.md](../../README.md) に位置づけの説明を置く（実施済み）。そのうえで、資料の改名または `docs/internal/` への集約を検討する。今後の新規ドキュメントでこの命名を踏襲しないこと。

### C-5. デモの命名と導線を整える ✅ 完了（2026-09-18 / `59f8db4`）
#### 対応結果（`59f8db4`）— Cowork 側で検証済み

| 検証項目 | 結果 |
|---|---|
| ライブラリ本体への波及 | **無し。** コミットが触れたのは `README.md` / `demo/src` 9 / `e2e` 23 のみ。`layerge/` と `tests/` は不在 |
| テスト ID | `links-*` **18 個**、`advanced-*` **22 個**（事前実測の 18 / 22 と一致）。`v2-*` / `v3-*` の残存 **0 件** |
| 旧名の残存 | `demo/src` `e2e` `README.md` に `v2-link` / `v3-advanced` / `fake-help` / `v3-guard` / `/fake/` はいずれも **0 件**。残るのは本書（履歴として正しい） |
| デモ目次 | 6 ページすべてに「何を実演するか」の 1 行説明あり |

#### 指示より広げた 3 点について

いずれも**妥当な判断**です。

- `/fake/*` を 6 種すべて `/no-route/*` に統一した件: 1 つだけ残せば「名前が事実に反する」状態が別の形で残る、という理由は正しいです。`/no-route/` は「ルート定義を持たない URL」という意図をそのまま表しており、`fake` より情報量が多い。
- E2E 2 ファイルの `git mv`: ルート名が変わった以上、追随しないとファイル名が嘘になります。
- README の `/fake/replace` 追随: 記述が事実と食い違うため必須でした。

#### 残った判断事項 2 件は C-6 / C-7 として切り出しました



他の開発者がデモを開いたときに迷わないようにします。2026-09-18 の調査結果です。

#### 問題 1: 版フェーズ名がデモの表層に出ています

| 現状 | 利用者が受ける印象 |
|---|---|
| ルート `/v2-link`、見出し **「v2 Link Demo」** | 「v2 と v3、いま自分はどちらを使っている？」 |
| ルート `/v3-advanced`、見出し **「v3 advanced demo」** | 「v3 のほうが新しい？」 |

**実際には両方とも `1.0.0` に入っています。**C-1（バージョン表記の混在）がドキュメントでは解消しましたが、**デモには残っていました。**デモは他の開発者が最初に触る場所であり、最も誤解を生みやすい位置です。

あわせて `/modal/fake-help` と `BridgeModalFakeHelpPage.vue` は **`fakePath` の遺物**です。オプションは `url` になったのに「fake」だけが残っています。

#### 改名の範囲（実測）

| 対象 | 箇所 |
|---|---|
| ルート `/v2-link` | demo 3 ファイル / e2e 1 本 |
| ルート `/v3-advanced` | demo 3 ファイル / **e2e 9 本** |
| `/modal/fake-help` 系 | demo 3 ファイル / e2e 1 本 |
| テスト ID `v2-*` | **18 個** |
| テスト ID `v3-*` | **22 個** |

**A-8（`fakepath` 命名の一掃）と同規模です。**A-8 で確立した手順（`git mv` で履歴を保つ、対応表による機械的置換、`dist` 比較で挙動不変を裏付ける）がそのまま使えます。

#### 推奨する新しい名前

| 現状 | 変更後 | 理由 |
|---|---|---|
| `/v2-link` | **`/links`** | 何のデモかが名前で分かる |
| `/v3-advanced` | **`/advanced`** | 同上 |
| `/modal/fake-help` | **`/modal/url-overlay`** | `url` オプションのデモであることを示す |
| `V2LinkDemoPage.vue` | `LinksDemoPage.vue` | |
| `V3AdvancedDemoPage.vue` | `AdvancedDemoPage.vue` | |
| `V3LeaveGuardContent.vue` | `LeaveGuardContent.vue` | |
| `BridgeModalFakeHelpPage.vue` | `BridgeUrlOverlayPage.vue` | |
| テスト ID `v2-*` / `v3-*` | `links-*` / `advanced-*` | ページ名と揃える |

> **ルート名だけ変えてテスト ID を `v2-*` のまま残さないでください。**ページ名と接頭辞がずれ、A-8 以前と同じ「名前が事実に反する」状態が別の形で生まれます。

#### 問題 2: デモの全体像を示す導線がありません

`HomePage` から `/v2-link` と `/v3-advanced` へのボタンはありますが、**何のデモなのかの説明がありません。**`/transition` と `/cache-state` に至っては、ページ下部の生のルート一覧に埋もれています。

**対応方針:**

1. **`demo/README.md` を新設**（Cowork 担当）— 起動方法と、各ページが何を示すのかの一覧。`demo/` を開いた人が最初に見る場所です
2. **`HomePage` に「デモ一覧」セクションを追加**（Code 担当）— 各デモへのリンクに一行の説明を添える。現在の生ルート一覧は残してよいが、一覧とは分ける
3. **各デモページの冒頭に「このページで何を確かめられるか」を 1 行**（Code 担当）— `TransitionDemoPage` と `CacheStatePage` には見出しすら無い箇所があります

> **Cowork の `demo/README.md` は、改名の完了後に書きます。**先に書くと古い名前で書くことになります。

---


#### 追加項目（2026-09-18 / 起動中のデモを実測して追加）

**7. デモ本体に残っているバージョン表記（実測で確定した全件）**

| 箇所 | 内容 |
|---|---|
| `HomePage.vue:37` | `v2 link demo` |
| `HomePage.vue:41` | `v3 advanced demo (controlledHooks / leaveGuard)` |
| `HomePage.vue:143` | `Layerge v1.1 should keep the latest operation consistent.` |
| `HomePage.vue:268` | `v1.1 の「最新が勝つ」仕様` |
| `TransitionDemoPage.vue:5` | `This page focuses on v1.x changes:` |
| `V2LinkDemoPage.vue:3` | `<h1>v2 Link Demo</h1>` |
| `V2LinkDemoPage.vue:171,207` | コメント内の `(v3)` / `(v2 scope)` |
| `V3AdvancedDemoPage.vue:3,8` | `v3 advanced demo` / `v3-only behaviors` |
| `V3AdvancedDemoPage.vue:41,148` | url 文字列 `/modal/v3-guard` |
| `router.js:44,45,149` | ルート定義とコメント |

**8. 画面に出る日本語（4 行のみ）**

user-facing は英語という決定に照らすと、デモの表示文字列は英語にすべきです。該当は次の 4 行だけで、範囲は限定的です。コメント・JSDoc の日本語は developer-facing なので**そのままで構いません**。

- `HomePage.vue:268` `naive: 連続pushは v1.1 の「最新が勝つ」仕様により、最後の1回だけが確定します。`
- `HomePage.vue:270` `sequential: 1回ずつ確定を待ってから次をpushするため、深さが増えていきます。`
- `V2LinkDemoPage.vue:22` `RouterLink 互換の最小導線（push/replace/open）`
- `V2LinkDemoPage.vue:121` `カスタム導線の正解ルート（bindings/handlers + hooks）`

**9. bridge route を直接開いて閉じると、足場のページに取り残されます**

実測した挙動です。

1. `/modal/fake-help` をフルリロードで開く → `mode: presenter` / `depth: 1` / URL は `/fake/help` に書き換わる（**ここまでは正常**）
2. オーバーレイの Close を押す → `depth: 0` / URL は `/modal/fake-help` に戻る
3. 画面に残るのは `Bridge route: /modal/fake-help — This page is an entry point for deep links.` という**足場そのもの**

deep link を共有された人がモーダルを閉じると、アプリの実画面ではなく開発用の説明ページに着地します。これは deep link を実装する利用者が最初に踏む落とし穴なので、デモが正しい形を示すべきです。bridge route 側で背景に実ページを置くか、閉じた後に `/` へ `replace` する導線を入れてください。あわせて README の deep link 節に、**bridge route は「閉じた後にどこへ着地するか」を決める責任を持つ**ことを明記します（Cowork が対応します）。

**10. `push+url` の直後は `lastEntryId` が取れません（デモ側の不具合）**

`V3AdvancedDemoPage.vue` の `pushWithUrl` は `nextTick` でスタック最上位の id を読みますが、`push+url` は非同期ナビゲーションを伴うため `nextTick` の時点ではまだ確定しておらず、`lastEntryId` が空のままになります（実測: `lastEntryId=-`）。`openComponent` は同期なので取得できます。

結果として、`push+url` の後に `closeAsync(lastEntryId)` ボタンが機能しません。新しい開発者がこのページで最初に試す操作のひとつなので、直しておくべきです。

**11. 確認済み: 中核の主張は実測で成立しています**

以下は不具合ではなく、**正常に動作していることの記録**です。

- `/` から `/modal/fake-help` を開く → `mode: presenter` / `depth: 1`、URL は `/fake/help`
- ブラウザの戻る → `depth: 0` / `mode: page` / URL は `/`
- このとき **`home mounts` は `1` のまま**（背景ページは再マウントされていない）、`window` に置いた番兵も生存（フルリロードが起きていない）

「戻るでオーバーレイだけが閉じ、背景が保持される」という Layerge の中心的な主張は、実測で確認できました。

### C-6. E2E ファイル名に開発フェーズの接頭辞が残っています ✅ 対応済み（2026-09-19 / `d777dbb`）

C-5 で demo 側は一掃しましたが、`e2e/` に 12 ファイル残っています。

| 接頭辞 | 件数 | ファイル |
|---|---|---|
| `v1x_` | 1 | `v1x_transition_demo` |
| `v3x_` | 3 | `v3x_close_async` / `v3x_pending_commit_waits` / `v3x_push_async_superseded` |
| `v4_` | 8 | `v4_decision_trace_*` 3 / `v4_failed_settle_*` 2 / `v4_stress_*` 3 |

**推奨: 何を検証しているかを表す名前に変える（接頭辞を落とすだけ）。**

理由は C-5 と同じです。`e2e/` を開いた新しい貢献者は「v1x と v3x と v4 は何が違うのか」「自分の変更はどれに足すのか」を考えることになりますが、これらはすべて 1.0.0 の機能であり、区別に意味はありません。`v4_decision_trace_*` は DecisionTrace の検証、`v3x_*` は非同期 API の検証、と内容で分かれているので、内容で命名すれば接頭辞は不要です。

C-5 より優先度を下げた（🟢）のは、E2E ファイル名は developer-facing で、利用者の目に触れないためです。ただし **`v3x_` / `v4_` の 11 ファイルは C-5 で既に編集が入っている**（ルート名の追随）ので、いま続けてやるのが最も安いタイミングです。

テスト ID を含まないファイル名だけの変更なので、`git mv` + import パスの追随で完結します。

---


#### 残った分（Code からの報告・妥当）

ファイル名の接頭辞は消えましたが、**テスト本文の `describe` / `test` 名**に `v3.x closeAsync demo` `v4: repeated …` などの表記が **12 件**残っています。「ファイル名のみ」と指示したので Code は触っていません。判断は正しいです。

これらは Playwright のレポート出力に現れるため、ファイル名と同じ理由で落とすべきです。ただし危険度は低く、A-19 の対応に含めて片付けるか、公開後に回すかはどちらでも構いません。**A-19 のほうが優先です。**

### C-7. `.claude/` の扱い ✅ 対応済み（2026-09-19 / `eabd999`）

Code がブラウザ確認用に `.claude/launch.json` を作成し、未追跡のまま残っています。

**推奨: `.claude/` をまとめて無視せず、ローカル成果物だけを `.gitignore` に入れる。**

理由: このリポジトリは既にルートに `CLAUDE.md` と `AGENTS.md` を置いており、AI による貢献を前提にした構成になっています。`.claude/` は今後、チームで共有すべき内容（`agents/` の役割定義、`commands/` のスラッシュコマンド、共有 `settings.json`）を置く場所になり得ます。ディレクトリごと `.gitignore` に入れると、**後からそれを共有したくなったときに、無視設定と戦うことになります。**

したがって `.gitignore` には次のように、ローカル専用のものだけを列挙します。

```
.claude/launch.json
.claude/settings.local.json
```

`launch.json` 自体は Code がデモ確認のために作った一時的なものなので、追跡する価値はありません。

### C-2. ドキュメントサイトの検討 🟢

README（599 行）が唯一の利用者向けドキュメントであり、すでに単一ファイルとしては大きすぎます。README 冒頭にも「A VitePress docs site is planned later」と記載があります。

A-1 の README 再構成を行う際に、そのまま分割してドキュメントサイト化する価値があります。

### C-3. 対応バージョンの検証範囲を明記する 🟢

README には `vue@3` / `vue-router@4` / `vue-router@5` で検証済みと記載があります。CI（B-2）でこのマトリクスを自動検証し、結果を README に反映できる状態にしてください。

---

## 完了済み

- [x] プロジェクトの目的・解決したい課題の明文化 → [docs/motivation.ja.md](../motivation.ja.md)
- [x] コーディング規約・JSDoc 規約のツール非依存化 → [docs/guidelines/](../guidelines/)
- [x] AI エージェント向けエントリポイントの整備 → [AGENTS.md](../../AGENTS.md)
- [x] ドキュメント索引の整備 → [docs/README.md](../../README.md)
- [x] npm 上での名前の空き確認（`layerge` は未使用）
- [x] README の Public API セクションを実装基準で全面改訂（A-1）
- [x] `docs/v3.0.md` の誤記に警告注記を追加（A-6 の暫定対応）
- [x] TypeScript 移行仕様書の作成（B-1）
- [x] A-2 / A-3 git 初期化と `.gitignore` / `.gitattributes`（`9bfdf24`）
- [x] A-6 デッドコード削除と関連ドキュメントの更新（`c4c2bb3`）
- [x] A-5 型定義への `usePresenterLeaveGuard` 追加（`08a4065`）。公開エクスポート 9 個すべてに型宣言が揃った
- [x] A-7 デモの `fakePath` → `url` 移行（`f7de883`）
- [x] A-8 `fakepath` 命名の一掃（`df2359d`）。`layerge/` と `tests/` は無変更
- [x] A-9 lint の検査範囲の統一と整形権威の一本化（`765c0d3`）。コーディング規約も実態に合わせて訂正
- [x] A-10 `no-console` の環境依存を解消（`f999228`）。両環境で lint 結果が一致することを確認済み
- [x] B-2 CI の設置（`9fd3baf`）。クリーンツリーで 3 ジョブの通し実行を確認済み
- [x] B-3 consumer の tarball 参照を固定名化（`b1133fc`）。1.0.1 で実測確認済み
- [x] B-4 `dist` の実行時スモークテスト（`0f9870c`）
- [x] B-5 型定義 2 ファイルの同一性検査（`2af0004`）
