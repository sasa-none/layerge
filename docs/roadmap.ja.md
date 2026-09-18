# npm 公開に向けた残課題

最終更新: 2026-09-18（B-1 段階 4 完了。残る .js は index.js と createLayergeRouter.js のみ）

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

**テストの実行結果については、Cowork は実装側の報告に依存します。**代わりに Cowork は「そのコミットが当該テストに影響し得るファイルを触っているか」を git から構造的に検証します。実行結果そのものを二重化したい場合は CI の記録を根拠としてください。

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
- 新しい `interface` / `type` は公開していません（[AGENTS.md](../AGENTS.md) の「公開 API を増やさない」に従い、インライン型のまま）
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

`prettier/prettier` を error に引き上げたことで、[コーディング規約](./guidelines/coding.ja.md) の記述と実態に矛盾が生じたため訂正しました。

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

実際には [demo/src/navLog.js:75](../demo/src/navLog.js) に 1 件存在しました。デモのナビゲーション結果を出力する意図的なものです。実装側で、理由コメント付きの `eslint-disable-next-line` により抑止されています（`allow` に `log` を足すとルールの意味が失われるため、この対応が正しい判断です）。

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

## 優先度 B — 公開直後に着手すべきもの

### B-1. TypeScript への全面移行 🔴 **公開前必須へ変更**

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
| 段階 4-b `noopHandle` 是正 | 次。**段階 5 の前に独立コミットで**（仕様書に決定を記載） |
| 段階 5 `createLayergeRouter` | 2,731 行。最難関 |
| 段階 6〜8 | 未着手 |

> **仕様書を 2026-09-18 に修正しました。**段階 0 完了時の指摘により、各段階の完了条件に `pnpm typecheck` が加わっています。
> あわせて `no-explicit-any` の運用と `strict` の引き上げ時期も確定しました。**段階 1 の着手前に仕様書を読み直してください。**

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

**B-1 段階 7 で手書きの型定義が廃止されるまでの暫定措置**である旨がコメントに残されています。

---

### 付記: B-4 のコミット時に E2E が 1 度赤になった件（調査済み）

B-4 のコミット時、E2E が 1 度赤になり、その結果を待たずにコミットが進みました（実装側から自己申告あり）。

**コードに起因しないことが構造的に確定しています。**コミット `0f9870c` が変更したのは `.github/workflows/ci.yml` と `scripts/smoke-dist.mjs` の 2 ファイルのみで、`layerge/` にも `demo/` にも `e2e/` にも一切触れていません。**E2E の結果に影響し得る変更が含まれていません。**

原因は、直前の B-2 検証で起動した vite dev サーバーが 4173 番に残存し、`playwright.config.js` の `reuseExistingServer: !process.env.CI` によって、削除済みの一時ディレクトリを配信するサーバーに対してテストが走ったため、と説明されています。設定を確認したところ整合しており、**CI では `CI` 環境変数が立つため `reuseExistingServer` は false になり、この経路は発生しません**（加えて CI は `retries: 2`）。

その後 3 回連続で 58 テスト passed、現在 4173 番は LISTEN されていないことも確認済みです。

---

### B-6. consumer lockfile の扱い 🟢

consumer の lockfile は tarball の integrity を含むため、ソースが変わるたびに古くなります（B-2 で `--no-frozen-lockfile` を使う理由）。git 管理から外す選択肢もありますが、その場合 `vue` / `vue-router` / `vite` の固定が失われます。**現状維持で実害はありません。**判断が必要になったときのための記録です。

---

## 優先度 C — 継続的に整えるもの

### C-1. バージョン表記の混在を解消する 🟡

`docs/` 配下には `v2/`、`v3.0.md`、`v4.0-spec.md`、`migration_v2_to_v3.md` があり、README 本文にも `v1.x` / `v2` / `v3.2` の表記が混在しています。

一方、npm 上の公開バージョンは `1.0.0` です。**これらの資料が指す機能はすでに `1.0.0` に含まれています。**

外部の読者は `v4.0-spec.md` を「将来のバージョン 4.0 の仕様」と解釈しますが、実際には過去の設計フェーズの呼称です。公開リポジトリでは確実に誤解を招きます。

**対応方針:** [docs/README.md](./README.md) に位置づけの説明を置く（実施済み）。そのうえで、資料の改名または `docs/internal/` への集約を検討する。今後の新規ドキュメントでこの命名を踏襲しないこと。

### C-2. ドキュメントサイトの検討 🟢

README（599 行）が唯一の利用者向けドキュメントであり、すでに単一ファイルとしては大きすぎます。README 冒頭にも「A VitePress docs site is planned later」と記載があります。

A-1 の README 再構成を行う際に、そのまま分割してドキュメントサイト化する価値があります。

### C-3. 対応バージョンの検証範囲を明記する 🟢

README には `vue@3` / `vue-router@4` / `vue-router@5` で検証済みと記載があります。CI（B-2）でこのマトリクスを自動検証し、結果を README に反映できる状態にしてください。

---

## 完了済み

- [x] プロジェクトの目的・解決したい課題の明文化 → [docs/motivation.ja.md](./motivation.ja.md)
- [x] コーディング規約・JSDoc 規約のツール非依存化 → [docs/guidelines/](./guidelines/)
- [x] AI エージェント向けエントリポイントの整備 → [AGENTS.md](../AGENTS.md)
- [x] ドキュメント索引の整備 → [docs/README.md](./README.md)
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
