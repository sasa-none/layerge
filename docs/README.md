# ドキュメント索引

このディレクトリには、Layerge の**開発者向け**資料（日本語）を置いています。
利用者向けの API リファレンスと使い方は、リポジトリ直下の [README.md](../README.md)（英語）を参照してください。

---

## まず読むもの

| ドキュメント | 内容 |
|---|---|
| [motivation.ja.md](./motivation.ja.md) | **なぜ Layerge が存在するのか。**解決したい課題、明示的な非目標、設計を貫く原則。コードを触る前に読んでください |
| [design_notes.md](./design_notes.md) | 安定させる設計判断。表示 3 状態、公開エントリ状態から意図的に外したもの、描画対象ルール、view-only な `open()`、クローズ意味論、latest-wins |

## 規約

| ドキュメント | 内容 |
|---|---|
| [guidelines/coding.ja.md](./guidelines/coding.ja.md) | コーディング規約（インデント・関数定義・制御構文・SCSS・命名・**TypeScript の書き方**） |
| [guidelines/jsdoc.ja.md](./guidelines/jsdoc.ja.md) | JSDoc 規約（説明責任・**`@internal` による公開契約の境界**・分岐コメント・アノテーション） |

この 2 つが規約の**正（Single Source of Truth）**です。
AI エージェント向けの設定（[AGENTS.md](../AGENTS.md) / [CLAUDE.md](../CLAUDE.md) / `.clinerules/`）は、すべてここを参照します。規約の本文をそれらに転記しないでください。

> **型は TypeScript が持ちます。**JSDoc 規約は 2026-09-18 の TypeScript 全面移行に伴い、
> 型宣言のルールを削除し、**説明責任**に役割を絞って再定義されています。

---

## internal/ — 公開物ではない資料

[internal/](./internal/) には、利用者に向けたものではない資料を置いています。

| ドキュメント | 内容 |
|---|---|
| [internal/outcome-and-tracing.md](./internal/outcome-and-tracing.md) | **内部 Outcome モデルと DecisionTrace の仕様。**stage × status の 2 軸、公開 4 値への射影規則、イベント種別、出力レベル、リーク不変条件と上限値。**保守する人向けの参照元です** |
| [internal/roadmap.ja.md](./internal/roadmap.ja.md) | 公開に向けた課題管理と担当分担。完了項目の記録を含みます |
| [internal/spec-typescript-migration.ja.md](./internal/spec-typescript-migration.ja.md) | TypeScript 全面移行の仕様書（2026-09-18 完了）。決定事項・却下案・未解決だった懸念・差分台帳の記録 |

---

## 2026-09-18 に整理しました

`v2/` / `v3.0.md` / `v4.0-spec.md` / `migration_v2_to_v3.md` / `v1x-headless-and-transition.md` は、
**設計フェーズの呼称であって npm のバージョンではない**ため、外部の読者を混乱させていました。次のとおり整理しています。

| 旧ファイル | 扱い |
|---|---|
| `v4.0-spec.md` | → **[internal/outcome-and-tracing.md](./internal/outcome-and-tracing.md)**（版番号を外して改名） |
| `v3.0.md` | **削除。**内容は README の Public API に統合済み。離脱ガードの記述は削除済みコードを説明していました |
| `v2/usage.md` | **削除。**Forward 復元が push 限定であること、`opened` と `entered` の違い、provide 不要である点を **README へ統合** |
| `v2/plan.md` | **削除。**完了済みの PR 計画 |
| `migration_v2_to_v3.md` | **削除。**未公開バージョン間の移行ガイドでした |
| `v1x-headless-and-transition.md` | **削除。**公開状態の非目標、描画対象ルール、hook 合成の例外安全性を **design_notes.md へ統合** |

削除したファイルは git 履歴から参照できます。**今後の新規ドキュメントで `vN` の命名を用いないでください。**
