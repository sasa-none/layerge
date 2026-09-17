# AGENTS.md

AI エージェント（Claude Code / Cline / その他）がこのリポジトリで作業する際の共通指示です。
ツール固有の設定ファイル（`CLAUDE.md` / `.clinerules/`）は、このファイルを参照します。**規約の本体をそれらに転記しないでください。**

---

## プロジェクト概要

**Layerge** は Vue Router の拡張で、モーダルやスタックカードといったオーバーレイを「プレゼンター」として履歴・URL と統合して扱えるようにするライブラリです。

- なぜ存在するのか: [docs/motivation.ja.md](./docs/motivation.ja.md) — **作業前に必ず読むこと**
- 設計判断: [docs/design_notes.md](./docs/design_notes.md)
- 公開 API と使い方: [README.md](./README.md)（英語・利用者向け）
- 残課題: [docs/roadmap.ja.md](./docs/roadmap.ja.md)

---

## 遵守すべき規約

作業前に以下を読み、従ってください。

| 規約 | 場所 |
|---|---|
| コーディング規約 | [docs/guidelines/coding.ja.md](./docs/guidelines/coding.ja.md) |
| JSDoc 規約 | [docs/guidelines/jsdoc.ja.md](./docs/guidelines/jsdoc.ja.md) |

特に間違えやすい点を再掲します。

- インデントは **4 スペース**、文末セミコロン必須、**末尾カンマ禁止**、オブジェクト波括弧内スペース禁止
- 関数は原則 `const` で定義する
- **ワンライナー `if` は禁止**。早期 return は推奨だが `{}` は必須
- SCSS の BEM は `&__` を使わず `@at-root` でフルクラス名を書く（検索性のため）
- コメント・JSDoc はすべて**日本語**で書く
- `if` / `else` / 三項演算子には必ず意図を説明するコメントを付ける

---

## 設計上の禁止事項

これらは「良かれと思って」破られやすいため、明示します。破る提案をする場合は、必ず理由とともに人間の判断を仰いでください。

- **公開 API を増やさない。** 便利だからという理由での追加は却下されます。公開した契約は削除できません。
- **公開ステータスを 4 値から増やさない。** `completed` / `aborted` / `failed` / `superseded` に固定です。内部の `blocked` は公開面では `aborted` に畳み込みます。
- **公開状態（`EntryContext` のフィールド等）を追加しない。**
- **UI をライブラリに持ち込まない。** confirm ダイアログ、フォールバック UI、z-index、CSS、アニメーションはアプリの責務です。
- **独自ルーターを内包しない。** ルーティングの真実の源はホストアプリの Vue Router です。
- **latest-wins を壊さない。** 競合時は常に最新の操作が勝ちます。古い処理は確定させません。

理由は [docs/motivation.ja.md](./docs/motivation.ja.md) の「明示的な非目標」および「設計を貫く 4 つの原則」に記載しています。

---

## ディレクトリ構成

```
layerge/            ライブラリ本体（公開対象のソース）
  components/       LayergeLink
  composables/      usePresenter / useLayerge / usePresenterBindings ほか
  core/             store / handle / id（内部状態）
  internals/        decisionTrace / devMetrics / env / keys / outcome（内部専用）
  router/           createLayergeRouter
  view/             LayergeView / LayergeTransition
demo/               動作確認用デモアプリ
tests/              ロジックテスト（Vitest）
e2e/                E2E テスト（Playwright）
docs/               設計資料・規約（日本語）
consumer-vue-router-4/  パック済み tarball の消費側検証（vue-router@4）
consumer-vue-router-5/  同上（vue-router@5）
```

`layerge/internals/` 配下は**内部専用**です。公開エクスポート（`layerge/index.js`）に追加しないでください。

---

## コマンド

```bash
pnpm install          # 依存インストール
pnpm test             # ロジックテスト（Vitest）
pnpm test:e2e         # E2E（Playwright。事前に pnpm e2e:install が必要）
pnpm lint:check       # lint 確認（自動修正なし）
pnpm lint             # lint 自動修正
pnpm build            # ライブラリビルド（vite lib mode）
pnpm demo:dev         # デモ起動
```

パッケージマネージャは **pnpm** です（`packageManager` 参照）。`npm install` は使わないでください。

---

## 変更時に必ず行うこと

1. 公開挙動を変えた場合、対応する E2E スペックを `e2e/` に追加または更新する
2. 公開 API を変えた場合、`README.md` と `index.d.ts` / `index.d.cts` の両方を更新する
3. 挙動の変更は `CHANGELOG.md` に記録する
4. 変更後に `pnpm test` と `pnpm lint:check` が通ることを確認する

---

## バージョン表記についての注意

`docs/` 配下には `v2` / `v3.0` / `v4.0-spec` といった資料がありますが、**これらは npm 上のパッケージバージョンではありません。**
公開バージョンは現在 `1.0.0` であり、これらの資料が指す機能はすでに `1.0.0` に含まれています。

詳細は [docs/README.md](./docs/README.md) を参照してください。混同しやすいため、新しいドキュメントでこの命名を踏襲しないでください。
