# npm 公開に向けた残課題

最終更新: 2026-09-17（TypeScript 移行方針の確定を反映）

このドキュメントは、Layerge を npm に公開するまでに残っている作業を記録します。
優先度は「公開の可否に直結するか」で判断しています。

npm レジストリ上で `layerge` という名前は**未使用であることを確認済み**です（404）。名前の確保は可能です。

---

## 担当分担

| 担当 | 項目 |
|---|---|
| **Claude Code**（実装） | A-2 / A-3 / A-5 / A-6 / A-7 / **B-1（TypeScript 移行）** / B-2 |
| **Cowork**（仕様の明文化・ドキュメント） | 仕様書の作成と更新、C-1、C-2、JSDoc 規約の再定義 |
| **ユーザー本人** | A-4（package.json メタデータ。リポジトリ構成を検討中のため、決定後に本人が記載） |

B-1 は [spec-typescript-migration.ja.md](./spec-typescript-migration.ja.md) を契約として実装してください。
**同書で曖昧な箇所を見つけた場合、実装側で判断せず、仕様書を更新してから進めてください。**

### Claude Code への着手順

1. **A-2 / A-3**（git init と `.gitignore`）— **必ず最初に行うこと。**
   現在このリポジトリは版管理されていないため、これ以降の削除・改名・移行が**取り消せません。**
   特に A-6 はファイル削除、B-1 は全ファイルの書き換えを伴います。退避先を作ってから着手してください。
2. **A-6**（デッドコード削除）— B-1 段階 5 の前提
3. **A-5**（型定義に `usePresenterLeaveGuard` 追加）— 宣言は A-5 の節にそのまま貼れる形で記載
4. **A-7**（デモの `url` 移行）
5. **B-2**（CI）— ここまでの成果を自動検証できる状態にする
6. **B-1**（TypeScript 移行）— 仕様書に従い段階 0 から順に

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

### A-2. git リポジトリが未初期化 🔴

`.git` が存在しません。公開パッケージとして次が成立していません。

- `package.json` に `repository` / `homepage` / `bugs` フィールドがなく、**npm ページからソースやイシュー報告先へ辿れない**
- 変更履歴が残っておらず、`CHANGELOG.md` の記述を裏付けるコミットがない
- CI を設置できない

**対応方針:** `git init` → `.gitignore` 整備 → 初回コミット。

リモートリポジトリの作成と `package.json` へのメタデータ追加（A-4）は**ユーザーが検討中**のため、ここでは行いません。
ローカルリポジトリの初期化は独立して進められます。**A-4 の決定を待たずに着手してください。**

---

### A-3. `.gitignore` が存在せず、成果物や巨大ファイルが同居している 🔴

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

### A-5. `usePresenterLeaveGuard` が型定義に存在しない 🔴

`layerge/index.js` は `usePresenterLeaveGuard` をエクスポートしていますが、**`index.d.ts` / `index.d.cts` に宣言がありません。**

TypeScript 利用者がこの composable を import すると、`has no exported member` エラーになります。公開エクスポートでありながら型が付いていない唯一の API です。

**対応方針:** `index.d.ts` / `index.d.cts` に宣言を追加する。実装のシグネチャは次のとおりです。

```ts
export declare function usePresenterLeaveGuard(opts?: {
    dirty?: Ref<boolean> | boolean;
    pending?: Ref<boolean> | boolean;
    commit?: () => Promise<void>;
    message?: string;
    confirm?: (ctx: {entryId: string; reason: string}) => boolean | Promise<boolean>;
}): {
    entryId: ComputedRef<string | null>;
    dirty: Ref<boolean> | boolean;
    pending: Ref<boolean> | boolean;
};
```

あわせて、`<LayergeLink>` は `index.d.ts` で `Component` としか宣言されておらず、props の型が効きません。TypeScript 移行（B-1）の際に解消を検討してください。

---

### A-6. `layerge/router/usePresenterLeaveGuard.js` がデッドコード 🔴

同名の composable が 2 つ存在し、**シグネチャが互換していません。**

| ファイル | シグネチャ | 状態 |
|---|---|---|
| `layerge/composables/usePresenterLeaveGuard.js` | `{dirty, pending, commit, message, confirm}` | **これが公開版。**`index.js` からエクスポートされ、`createLayergeRouter` が実際に呼び出している |
| `layerge/router/usePresenterLeaveGuard.js` | `{entryId, when, confirm, guardSpaNavigation}` | **どこからも import されていないデッドコード** |

さらに悪いことに、**`docs/v3.0.md` が記載していたのは後者（デッドコード側）でした。**
つまり公開ドキュメントが、存在しない API の使い方を説明していたことになります。

**対応方針:** `layerge/router/usePresenterLeaveGuard.js` を削除する。同名ファイルが残っている限り、将来また取り違えが起きます。
`docs/v3.0.md` には暫定の警告注記を追加済みです。

---

### A-7. デモが非推奨 API を使い続けている 🟡

`demo/src/pages/HomePage.vue` ほかが `fakePath` を使用しており、E2E のテスト ID も `modal-replace-fakepath` のままです。

README はデモの実装に合わせて記述する必要があるため、現在は「デモは非推奨の `fakePath` を使っている」旨の注記を入れて整合を取っています。**デモは利用者が最初に読むサンプルコードであるため、`url` へ移行すべきです。**

移行時はテスト ID の改名（`modal-replace-fakepath` → `modal-replace-url`）も伴い、E2E スペック 2 本（`modal_replace_fakepath.spec.js` / `modal_replace_close_restore.spec.js`）の更新が必要です。

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

移行の前提として **A-6（デッドコード削除）を先に済ませてください。**同名ファイルが残ったまま段階 5 に入ると取り違えが起きます。

未解決の懸念（`strict` をどこまで貫けるか、生成型と手書き型の差分判定、`PresenterTarget` の型ガード、内部メンバーの露出）は仕様書の第 6 章に記載しています。**実装中にそこで詰まった場合は、判断せずに相談してください。**

---

### B-2. CI の設置 🟡

現在 CI がありません。最低限、次をプルリクエストで自動実行すべきです。

- `pnpm lint:check`
- `pnpm test`（Vitest）
- `pnpm test:e2e`（Playwright）
- `npm pack` の内容検証と、`consumer-vue-router-4` / `consumer-vue-router-5` による消費側インストール・ビルド確認

消費側検証ディレクトリはすでに存在するため、**CI 化の材料は揃っています。**
[AGENTS.md](../AGENTS.md) の「変更時に必ず行うこと」を機械的に強制する場でもあります。

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
