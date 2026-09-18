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

## 7-b. TypeScript の書き方（2026-09-18 追加）

TypeScript への全面移行にあたり実際に踏んだ問題から、守るべき規則を定めます。

### 7-b-1. `any` は使わないこと

`@typescript-eslint/no-explicit-any` は **error** です。**ルールを全体で弱めないでください。**

やむを得ず必要な場合は、**理由コメント付きの個別抑止**で対応します。

```ts
// 外部ライブラリの型が実態と合わないため、この 1 箇所のみ許容する
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = external as any;
```

> 現在、実装にも公開型にも `any` は **1 件もありません**（抑止コメントもゼロ）。この状態を維持してください。
> 抑止コメントが増えてきた場合、それ自体が「型付けが破綻している」という信号です。

### 7-b-2. 型注釈は「入力側」に置くこと

型変換を伴う API（`reactive()` など）では、**注釈を入力側に置き、出力に `as` を使います。**逆にしてはいけません。

```ts
// ✅ 正しい: 過不足と型の誤りは initial の時点で検査される
const initial: LayergeStore = { /* ... */ };
return reactive(initial) as LayergeStore;

// ❌ 誤り: 入力が無検査になり、フィールドを書き間違えても通る
return reactive({ /* ... */ }) as LayergeStore;
```

`reactive()` の戻り値型 `UnwrapNestedRefs<T>` は vue-router の型を深く展開するため、素直に書くと型エラーになります。
**`as` で無効化してよいのはこの型変換だけで、実体の検査ではありません。**

### 7-b-3. `as unknown as` は使わないこと

二重キャストは型システムを完全に迂回します。**これが必要になった時点で、型か実装のどちらかが誤っています。**
本プロジェクトでは実際に、`as unknown as` で覆い隠されていた箇所が公開 API の欠陥（`settled` が不正値を返す）でした。

### 7-b-4. `.vue` の props は runtime 宣言を保つこと

`defineProps<T>()` の型ベース宣言に移すと、**ランタイムの props 宣言が変わります**（`required` が失われ、`type` が狭まる）。
`defineProps({...})` の形を保ち、`PropType<T>` で型を与えてください。

```ts
const props = defineProps({
    presenter: {type: String as PropType<string>, required: true},
    component: {type: [Object, Function] as PropType<Component>, required: false}
});
```

> **この種の変化は型検査では検出できません。**`.vue` を触ったら `dist` の出力を確認してください。

---

## 8. 命名規則
- 変数・関数は lowerCamelCase  
- クラス名は BEM 準拠  
- 定数は大文字スネークケース（例：`MAX_COUNT`）  

---

## 9. インポート・モジュール
- 未使用インポートの削除を徹底  
