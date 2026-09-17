# ドキュメント索引

このディレクトリには、Layerge の**開発者向け**資料（日本語）を置いています。
利用者向けの API リファレンスと使い方は、リポジトリ直下の [README.md](../README.md)（英語）を参照してください。

---

## まず読むもの

| ドキュメント | 内容 |
|---|---|
| [motivation.ja.md](./motivation.ja.md) | **なぜ Layerge が存在するのか。**解決したい課題、明示的な非目標、設計を貫く原則。コードを触る前に読んでください |
| [design_notes.md](./design_notes.md) | v1.x で安定させる設計判断（表示 3 状態、view-only な `open()`、クローズ意味論、latest-wins） |
| [roadmap.ja.md](./roadmap.ja.md) | npm 公開に向けた残課題と担当分担 |
| [spec-typescript-migration.ja.md](./spec-typescript-migration.ja.md) | **TypeScript 全面移行の仕様書。**実装との契約であり、決定事項・却下案・未解決の懸念・受け入れ条件を含む |

## 規約

| ドキュメント | 内容 |
|---|---|
| [guidelines/coding.ja.md](./guidelines/coding.ja.md) | コーディング規約（インデント・関数定義・制御構文・SCSS・命名） |
| [guidelines/jsdoc.ja.md](./guidelines/jsdoc.ja.md) | JSDoc 規約（型宣言・定数・関数・クラス・通常コメント・アノテーション） |

この 2 つが規約の**正（Single Source of Truth）**です。
AI エージェント向けの設定（[AGENTS.md](../AGENTS.md) / [CLAUDE.md](../CLAUDE.md) / `.clinerules/`）は、すべてここを参照します。規約の本文をそれらに転記しないでください。

---

## 設計フェーズ資料について（重要）

以下は**過去の設計フェーズの記録**です。

| ドキュメント | 内容 |
|---|---|
| [v2/plan.md](./v2/plan.md) / [v2/usage.md](./v2/usage.md) | v2 フェーズの計画と使い方 |
| [migration_v2_to_v3.md](./migration_v2_to_v3.md) | v2 → v3 の移行メモ |
| [v3.0.md](./v3.0.md) | v3.0 で追加・変更された API（`url`、`mountPreset`、`controlledHooks`、leave guard、`LayergeLink`） |
| [v4.0-spec.md](./v4.0-spec.md) | v4.0 の内部正規化仕様（Outcome モデル、DecisionTrace、リーク検証） |
| [v1x-headless-and-transition.md](./v1x-headless-and-transition.md) | v1.x のヘッドレス構成とトランジション |

> [!IMPORTANT]
> **これらの `v2` / `v3` / `v4` は、npm 上のパッケージバージョンではありません。**
>
> 公開バージョンは現在 **`1.0.0`** であり、これらの資料が扱う機能は**すでに `1.0.0` に含まれています**。
> `v4.0-spec.md` は「将来のバージョン 4.0 の仕様」ではなく、過去の設計フェーズの呼称です。
>
> 特に [v3.0.md](./v3.0.md) は、`url` オプションや `controlledHooks` など **現行 `1.0.0` の実装仕様**を記述した実質的な現役資料です。
> 一方で直下の README はこれらをほとんど反映できていません（[roadmap.ja.md](./roadmap.ja.md) の A-1 参照）。
>
> 今後の新規ドキュメントで、この `vN` 命名を踏襲しないでください。
