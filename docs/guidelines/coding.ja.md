# コーディング規約（公開用）

> **このファイルが正（Single Source of Truth）です。**
> AI エージェント向けの設定（`AGENTS.md` / `CLAUDE.md` / `.clinerules/`）は、すべてこのファイルを参照します。
> 規約を変更する場合は必ずこのファイルを編集してください。転記したコピーを作らないでください。
>
> 関連: [JSDoc 規約](./jsdoc.ja.md) / [ドキュメント索引](../README.md)


## 1. 基本方針
- ESLint / Stylelint / EditorConfig / **Prettier** に準拠
- 自動整形ツールによる一貫性確保
- チーム全体で統一記法維持

> **整形の権威は Prettier です（2026-09-17 決定 / コミット `765c0d3`）。**
> 以前は ESLint の `indent` ルールと Prettier が二重に整形を管理しており、
> `eslint --fix` が出力した整形を同じ ESLint が error として弾く状態が発生していました。
> 現在は ESLint 側の `indent` を外し、`prettier/prettier` を **error** として検査しています。
> **インデント幅・行長・引用符などの整形ルールは `prettier.config.js` が唯一の定義元です。**
> 本書のうち整形に関する記述は、Prettier 設定の説明として読んでください。

---

## 2. インデント・改行・空行
- インデント幅 4 スペース（`prettier.config.js` の `tabWidth: 4` が担保。テンプレートは `vue/html-indent` が別途 4 を強制）
- 連続空行最大 3 行  
- ファイル末尾改行必須  

---

## 3. セミコロン・カンマ・スペース
- 文末セミコロン必須  
- 末尾カンマ禁止  
- オブジェクト波括弧内スペース禁止  

---

## 4. 関数定義
- 関数は **原則 `const` で定義**  
- 無名関数前スペースあり（`function (x){}`）  
- 名前付き関数前スペースなし（`function fn(x){}`）  
- 非同期アロー関数は `async () => {}` 形式採用  

---

## 5. 制御構文
- **ワンライナー if（`if (cond) return ...;`）は禁止**  
- `if-else` は利用可能（必ずブロック `{}` を使用）  
- 三項演算子は許容（可読性を保つ範囲で使用）  
- 早期 return を積極採用（ただし `{}` 必須）  

---

## 6. 行長・記法
- **行長は 110 文字**（`prettier.config.js` の `printWidth: 110`）。超過分は Prettier が自動で折り返します
    - 本書は以前「行長制限なし」と記載していましたが、`prettier/prettier` を error に引き上げた時点（`765c0d3`）で**実態と矛盾したため訂正しました**
    - 手で折り返す必要はありません。`pnpm format` に任せてください
- Yoda 記法禁止（`if (x === 1)` 形式採用）

---

## 7. CSS / SCSS 規約
- 標準 + SCSS 推奨設定準拠  
- プロパティ順序は `recess-order` 採用  
- コメント前後の空行ルール適用  
- **BEM は `&__` 不使用。`@at-root` でフルクラス名記載**（検索性重視）  

**例（OK）**
```scss
.card {
    display: grid;
    padding: 16px;

    @at-root {
        .card__title {
            margin: 0;
            font-weight: bold;
        }
    }
}
```

**例（NG）**
```scss
.card {
    &__title { // &__ 禁止
        font-weight: bold;
    }
}
```

---

## 8. 命名規則
- 変数・関数は lowerCamelCase  
- クラス名は BEM 準拠  
- 定数は大文字スネークケース（例：`MAX_COUNT`）  

---

## 9. インポート・モジュール
- 未使用インポートの削除を徹底  
