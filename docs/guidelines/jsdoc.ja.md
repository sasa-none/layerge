# JSDoc 規約

> **このファイルが正（Single Source of Truth）です。**
> AI エージェント向けの設定（`AGENTS.md` / `CLAUDE.md` / `.clinerules/`）は、すべてこのファイルを参照します。
>
> **注意:** 本プロジェクトは TypeScript への全面移行を予定しています（[roadmap](../roadmap.ja.md) 参照）。
> 移行後は「2-3 型宣言時のルール」の大半を TypeScript の型注釈が担うため、本規約は
> 説明責任（日本語コメント・1 行目の形式・分岐コメント・アノテーション）に役割を絞って再定義する必要があります。
> 移行が完了するまでは、本規約がそのまま有効です。
>
> 関連: [コーディング規約](./coding.ja.md) / [ドキュメント索引](../README.md)

## 1. 基本方針
- **関数・定数・クラスを宣言する場合には必ずJSDocを記載すること。**
- **JSDocのコメントは明確かつ簡潔に記述すること。**
- すべてのコメントは **日本語（Ja-JP）** で統一すること。

---

## 2. 基本コメントルール

### 2-1 コメントの形式
- コメントの1行目は `/** 変数名または関数名 - 説明` の形式で始めること。
- 1行目のコメントと、続く@コメントの間には空行を **入れない** こと

```javascript
/**
 * PI - 円周率
 * @type {number}
 */
const PI = 3.14159;
```

### 2-2. JSDocコメントの記載順序
- @コメントの後に型や説明を必要としないコメント「属性コメント」を先に記載する
- @コメントの後に型や説明を記載する「注釈コメント」を、**「属性コメント」の後** に記載する。

```javascript
/**
 * API_BASE_URL - APIのベースURL
 * @constant
 * @type {string}
 */
const API_BASE_URL = 'https://api.example.com';
```

### 2-3. 型宣言時のルール

- 型宣言には以下の文言を用いること
- any型は原則使用しないこと（使用する場合は処理内で必ずフォールバックされていること）
- Object型・Record型は原則使用せず、`@typedef` コメントを用いてカスタム型を定義し宣言すること
- 固定値・特定値の宣言に用いるリテラル型は過度に使用しないこと（最大5種を目安とする）

#### 基本

| ケース                           | 俗称      | 宣言方法    | 例                    |
|----------------------------------|-----------|-------------|-----------------------|
| 文字列を宣言する場合             | 文字列型  | string      | `'文字列'`            |
| 数値を宣言する場合               | 数値型    | number      | `0`, `3.14`           |
| 真偽値を宣言する場合             | 真偽値型  | boolean     | `true`, `false`       |
| 未定義の値を宣言する場合         | 未定義型  | undefined   | `undefined`           |
| 値が存在しない場合を宣言する場合 | null型    | null        | `null`                |
| 関数を宣言する場合               | 関数型    | Function    | `(a, b) => a + b`     |
| 日付を扱う場合                   | 日付型    | Date        | `new Date()`          |
| 非同期処理を扱う場合             | Promise型 | Promise<型> | `new Promise()`       |
| エラーを扱う場合                 | エラー型  | Error       | `new Error('エラー')` |

#### 配列とコレクション

| ケース                                   | 俗称               | 宣言方法       | 例                     |
|------------------------------------------|--------------------|----------------|------------------------|
| 同一型の要素を持つ配列を宣言する場合     | 配列型             | 型[]           | `[1, 2, 3]`            |
| 複数の型が混在する配列を宣言する場合     | 混在配列型         | (型 \| 型)[]   | `['文字列', 1]`        |
| オブジェクトの配列を宣言する場合         | オブジェクト配列型 | 型[]           | `[{a: 1}, {b: 2}]`     |
| ネストされた配列を宣言する場合           | ネスト配列型       | 型[][]         | `[[1, 2], [3, 4]]`     |
| 複数型が混在するネスト配列を宣言する場合 | 混在ネスト配列型   | (型 \| 型)[][] | `[['文字列'], [1, 2]]` |

#### HTML要素とHTMLコレクション

| ケース                                       | 俗称                      | 宣言方法                      | 例                                      |
|----------------------------------------------|---------------------------|-------------------------------|-----------------------------------------|
| HTMLElementのノードリストを宣言する場合      | HTMLElementノードリスト型 | NodeListOf<HTMLElement>       | `document.querySelectorAll('div')`      |
| HTMLElementのHTMLコレクションを宣言する場合  | HTMLElementコレクション型 | HTMLCollectionOf<HTMLElement> | `document.getElementsByTagName('div')`  |
| HTMLCollectionやNodeListを配列に変換する場合 | HTML要素配列型            | HTMLElement[]                 | `[...document.querySelectorAll('div')]` |

#### ユニオン・複合

| ケース                             | 俗称                | 宣言方法        | 例                      |
|------------------------------------|---------------------|-----------------|-------------------------|
| 複数の型を持つ値を宣言する場合     | ユニオン型          | 型 \| 型        | `1`, `'文字列'`         |
| 配列内に複数型の要素を持つ場合     | 混在配列型          | (型 \| 型)[]    | `[1, '文字列']`         |
| 型が未定義または特定の型である場合 | ユニオン型 (未定義) | 型 \| undefined | `'文字列'`, `undefined` |

#### 固定値・特定値の宣言

| ケース                                    | 俗称                     | 宣言方法             | 例                     |
|-------------------------------------------|--------------------------|----------------------|------------------------|
| 固定または特定の文字列を使用する場合      | 文字列リテラル型         | '値'                 | `'foo'`                |
| 固定または特定の数値を使用する場合        | 数値リテラル型           | 数値                 | `42`                   |
| 固定または特定の真偽値を使用する場合      | 真偽値リテラル型         | true / false         | `true`                 |
| 固定または特定の`null`を使用する場合      | nullリテラル型           | null                 | `null`                 |
| 固定または特定の`undefined`を使用する場合 | undefinedリテラル型      | undefined            | `undefined`            |
| 複数の固定または特定文字列を許容する場合  | 文字列リテラルユニオン型 | '値1' \| '値2'       | `'foo' \| 'bar'`       |
| 複数の固定または特定数値を許容する場合    | 数値リテラルユニオン型   | 数値 \| 数値         | `1 \| 2 \| 3`          |
| 複数の真偽値を許容する場合                | 真偽値リテラルユニオン型 | true \| false        | `true \| false`        |
| 複数の値（混在）を許容する場合            | 混在リテラルユニオン型   | '値' \| 数値 \| null | `'foo' \| 42 \| null'` |

#### 特殊

| ケース                         | 俗称                 | 宣言方法                    | 例                                        |
|--------------------------------|----------------------|-----------------------------|-------------------------------------------|
| 任意の値を宣言する場合         | 任意型               | any                         | `'文字列'`, `0`, `true`                   |
| 値がないが型を無視する場合     | void型               | void                        | `undefined`                               |
| 特定のリテラル値を宣言する場合 | リテラル型           | '値'                        | `'特定値'`                                |
| 正規表現を扱う場合             | 正規表現型           | RegExp                      | `/pattern/`, `new RegExp*()`              |
| 配列バッファを扱う場合         | 配列バッファ型       | ArrayBuffer                 | `new ArrayBuffer(16)`                     |
| 型付き配列を扱う場合           | 型付き配列型         | TypedArray                  | `new Uint8Array([0, 255])`                |
| マップを扱う場合               | マップ型             | Map<keyの型, valueの型>     | `new Map([[1, 'one']])`                   |
| セットを扱う場合               | セット型             | Set<型>                     | `new Set([1, 2, 3])`                      |
| ウィークマップを扱う場合       | ウィークマップ型     | WeakMap<keyの型, valueの型> | `new WeakMap()`                           |
| ウィークセットを扱う場合       | ウィークセット型     | WeakSet<型>                 | `new WeakSet()`                           |
| ジェネレーターを扱う場合       | ジェネレーター型     | Generator<型>               | `function* generator() {}`                |
| イテレーターを扱う場合         | イテレーター型       | Iterator<型>                | `{ next: () => ({ value, done }) }`       |
| 非同期イテレーターを扱う場合   | 非同期イテレーター型 | AsyncIterator<型>           | `for await (const x of asyncIterable) {}` |

### 2-4. Objectの型宣言ルール
- Objectの型を定義する場合は、`@typedef`コメントを使用してカスタム型を宣言すること
- Objectの各valueは`@property`コメントを使用して型を宣言すること
- 同じ名前の型を複数定義しないように注意すること

#### 単純なオブジェクト型
```javascript
/**
 * @typedef {object} User
 * @property {string} name - ユーザー名
 * @property {number} age - ユーザーの年齢
 * @property {boolean} isActive - ユーザーがアクティブかどうか
 */

/**
 * user - ユーザ情報
 * @type {User}
 */
const user = {
    name: 'Alice',
    age: 30,
    isActive: true
};
```

#### ネストされたオブジェクト型
```javascript
/**
 * @typedef {object} Address
 * @property {string} street - 通りの名前
 * @property {string} city - 市の名前
 * @property {string} zip - 郵便番号
 */

/**
 * @typedef {object} UserWithAddress
 * @property {string} name - ユーザー名
 * @property {number} age - ユーザーの年齢
 * @property {Address} address - ユーザーの住所
 */

/**
 * @type {UserWithAddress}
 */
const userWithAddress = {
    name: 'Bob',
    age: 25,
    address: {
        street: '123 Main St',
        city: 'Tokyo',
        zip: '123-4567'
    }
};
```

#### プロパティ名が動的な場合
```javascript
/**
 * @typedef {object} Dictionary
 * @property {string} [key] - 任意のキー。
 * @property {any} value - 値。
 */

/**
 * @type {Dictionary}
 */
const dictionary = {
    key: 'exampleKey',
    value: 'exampleValue'
};
```

## 3. 定数宣言のJSDoc記載ルール

### 3-1. 必須ルール
1. 定数であることを明示するため、`@constant` コメントを必ず記載すること。
2. 定数の型を明確にするため、`@type` コメントを必ず記載すること。

### 3-2 記載例
```javascript
/**
 * API_BASE_URL - APIのベースURL
 * @constant
 * @type {string}
 */
const API_BASE_URL = 'https://api.example.com';

/**
 * SUPPORTED_LANGUAGES - サポートされている言語のリスト
 * @constant
 * @type {string[]}
 */
const SUPPORTED_LANGUAGES = ['en', 'ja', 'fr'];

/**
 * INITIAL_SETTINGS - アプリケーションの初期設定
 * @constant
 * @type {object}
 * @property {boolean} debug - デバッグモードの有効化。
 * @property {number} retryCount - 再試行回数。
 */
const INITIAL_SETTINGS = {
    debug: false,
    retryCount: 3
};
```

---

## 4. 関数のJSDoc記載ルール

### 4-1. 必須ルール
- 関数には `@param` と `@returns` を記載すること
- 関数が明示的にエラーをスローする場合は `@throws` も記載すること
- 関数の引数が省略可能である場合は`[]`（ブラケット）を使用すること
- 関数の引数にデフォルト値が設定されている場合は、`[]`（ブラケット）を使用し、`=`で値を示すこと

### 4-2. 記載例

#### 通常
```javascript
/**
 * registerUser - ユーザーを登録します
 * @param {string} [username='Guest'] - 登録するユーザー名（デフォルトは 'Guest'）
 * @param {number} age - 登録するユーザーの年齢（必須）
 * @throws {Error} 年齢が18未満の場合にエラーをスローします
 * @returns {object} 登録されたユーザー情報
 */
const registerUser = (username = 'Guest', age) => {
    if (age < 18) {
        throw new Error('ユーザーは18歳以上である必要があります。');
    }

    return {username, age};
};
```

#### 引数の分割代入を行う場合（Object）
```javascript
/**
 * processUser - ユーザー情報を処理します。
 * @param {object} user - ユーザー情報を表すオブジェクト
 * @param {string} user.name - ユーザーの名前
 * @param {number} user.age - ユーザーの年齢
 * @returns {string} ユーザーの名前と年齢を表す文字列
 */
const processUser = ({name, age}) => {
    return `${name} is ${age} years old.`;
};

/**
 * processAddress - ユーザーの住所を処理します
 * @param {object} user - ユーザー情報を表すオブジェクト
 * @param {string} user.name - ユーザーの名前
 * @param {object} user.address - ユーザーの住所
 * @param {string} user.address.city - ユーザーの住む市
 * @param {string} user.address.zip - ユーザーの郵便番号
 * @returns {string} ユーザーの住所を表す文字列
 */
const processAddress = ({name, address: {city, zip}}) => {
    return `${name} lives in ${city}, ZIP: ${zip}`;
};

/**
 * 設定情報を処理します
 * @param {object} config - 設定オブジェクト
 * @param {string} [config.mode='default'] - アプリケーションのモード（デフォルトは 'default'）
 * @param {number} [config.timeout=3000] - タイムアウト時間（ミリ秒）
 * @returns {string} 設定情報を文字列で返します
 */
const processConfig = ({mode = 'default', timeout = 3000}) => {
    return `Mode: ${mode}, Timeout: ${timeout}ms`;
};
```

#### 引数の分割代入を行う場合（Array）
```javascript
/**
 * sumPair - 2つの数値を受け取り、その合計を計算します
 * @param {number[]} numbers - 2つの数値を含む配列
 * @param {number} numbers.0 - 配列内の最初の数値
 * @param {number} numbers.1 - 配列内の2番目の数値
 * @returns {number} 2つの数値の合計
 */
const sumPair = ([a, b]) => a + b;

/**
 * sumNestedArray - ネストされた配列から値を取り出して合計を計算します
 * @param {number[][]} nestedArray - 2次元配列
 * @param {number} nestedArray.0.0 - 最初の配列の最初の値
 * @param {number} nestedArray.0.1 - 最初の配列の2番目の値
 * @param {number} nestedArray.1.0 - 2番目の配列の最初の値
 * @param {number} nestedArray.1.1 - 2番目の配列の2番目の値
 * @returns {number} 配列内のすべての値の合計
 */
const sumNestedArray = ([[a, b], [c, d]]) => a + b + c + d;

/**
 * sumAll - 配列内のすべての値を合計します
 * @param {number[]} numbers - 任意の数値を含む配列
 * @returns {number} 配列内の数値の合計
 */
const sumAll = (...numbers) => numbers.reduce((sum, num) => sum + num, 0);

/**
 * sumWithDefaults - 3つの数値を受け取り、それぞれを合計します。足りない場合はデフォルト値を使用します
 * @param {number[]} numbers - 最大3つの数値を含む配列
 * @param {number} [numbers.0=0] - 最初の数値（デフォルト値は 0）
 * @param {number} [numbers.1=0] - 2番目の数値（デフォルト値は 0）
 * @param {number} [numbers.2=0] - 3番目の数値（デフォルト値は 0）
 * @returns {number} 配列内のすべての数値の合計
 */
const sumWithDefaults = ([a = 0, b = 0, c = 0]) => a + b + c;
```

## 5. クラスのJSDoc記載ルール

### 5-1. 必須ルール
- class構文を使用する場合、`@class` を使用しクラス全体の説明を記載すること
- クラスの継承をしている場合は、`@extends` を使用し継承しているクラスを記載すること
- コンストラクタ関数で定義する場合、`@constructor` を使用しインスタンス化の説明を記載すること
- クラスのプロパティは、`@property` を記載すること
- クラスのメソッドには `@param` と `@returns` を記載すること
- staticキーワードを使用して定義しているプロパティ及びメソッドには `@static` を使用してクラスに属することを明示すること
- `#`接頭辞使用して定義しているパブリッククラスフィールドには、`@private` を使用して外部からアクセスできないことを明示すること
- インターフェースを定義する場合は、`@typedef`でインターフェースを定義し、`@implements`を使用して特定のインターフェースに従っていること明示すること

### 5-2. 任意ルール
- `@protected` 及び `@readonly` はJavaScriptでは厳密に制限することができないため、プロジェクトの命名規則に沿って運用すること
    - 例えば、`_`を接頭辞に使用しているフィールドまたはメソッドは`@protected`とするなど
- `@public`は記載を必須としないが、記載する場合はプロジェクト全体で統一すること

```javascript
/**
 * ユーザークラス
 * @class
 */
class User {
    /**
     * #isActive
     * @private
     * @type {boolean}
     * @description ユーザーがアクティブかどうかを示す
     */
    #isActive = true;

    /**
     * @constructor
     * @param {string} name - ユーザーの名前
     * @param {number} age - ユーザーの年齢
     */
    constructor(name, age) {

        /**
         * User.name - ユーザー名
         * @type {string}
         */
        this.name = name;

        /**
         * User.age - ユーザーの年齢
         * @type {number}
         */
        this.age = age;
    }

    /**
     * User.isActive - ユーザーがアクティブかどうかを取得
     * @type {boolean}
     */
    get isActive() {
        return this.#isActive;
    }

    /**
     * User.isActive - ユーザーがアクティブかどうかを設定
     * @param {boolean} value - アクティブ状態を設定する値
     * @throws {Error} value が真偽値でない場合にスロー
     */
    set isActive(value) {
        if (typeof value !== 'boolean') {
            throw new Error('value must be a boolean');
        }

        this.#isActive = value;
    }

    /**
     * User.getInfo - ユーザーの名前と年齢を取得します
     * @returns {string} 名前と年齢を含む文字列
     */
    getInfo() {
        return `${this.name} is ${this.age} years old.`;
    }

    /**
     * createUser - ユーザーインスタンスを作成する静的ヘルパーメソッド
     * @static
     * @param {object} userInfo - ユーザー情報オブジェクト
     * @param {string} userInfo.name - ユーザーの名前
     * @param {number} userInfo.age - ユーザーの年齢
     * @returns {User} 新しいユーザーインスタンス
     */
    static createUser({name, age}) {
        return new User(name, age);
    }
}
```

## 6. 汎用JSDocコメントルール

- 必須としないが、必要に応じて汎用コメントを適切に使用しコードの意図を明確に伝えるようにすること

| コメント        | 概要                                            | 利用ケース                                                 | 使用例                                                                            |
|------------------|------------------------------------------------|------------------------------------------------------------|-----------------------------------------------------------------------------------|
| **`@default`**     | プロパティのデフォルト値を記載します。       | オプション引数やプロパティの初期値を示したい場合。         | `@default 10`                                                                     |
| **`@deprecated`**  | 非推奨であることを示します。                 | 使用を避けるべきメソッドやクラスを明示したい場合。         | `@deprecated このメソッドは廃止予定です。代わりに newMethod を使用してください。` |
| **`@description`** | 詳細な説明を記載します。                     | 関数やクラス、プロパティの具体的な動作を補足する場合。     | `@description このメソッドは指定された値を計算します。`                           |
| **`@example`**     | 使用例を示します。                           | 関数やクラスの使用方法を明確に伝えたい場合。               | `@example calculate(5, 10); // 結果は 50`                                         |
| **`@ignore`**      | ドキュメント生成時に特定の要素を無視します。 | 特定のプロパティやメソッドを非公開にしたい場合。           | `@ignore このメソッドは内部利用専用です。`                                        |
| **`@link`**        | 外部リンクや参照箇所を示します。             | メソッドやクラス、プロパティの詳細を別途参照させたい場合。 | `@link https://example.com API ドキュメント`                                      |
| **`@see`**         | 関連情報や参考資料へのリンクを示します。     | 詳細な情報や関連する仕様を示したい場合。                   | `@see {@link https://developer.mozilla.org/\| MDN ドキュメント}`                  |


## 7. 通常コメントルール

### 7-1. 基本方針

- if/else文および三項演算子には必ずコメントを記載すること
- アノテーションコメントを積極的に活用し、コードの中に次のタスクや現在の問題点を明確に記載すること

#### if/else文のコメントルール

- if/else文は、各条件の直前に「条件分岐についての説明」をコメントとして記載し、分岐の意図を明確にする

```javascript
// システムが正常動作している場合、正常動作中のログを記録
if (systemStatus === 'operational') {
    logStatus('System operational');

// システムが警告状態の場合、警告を通知
} else if (systemStatus === 'warning') {
    notifyAdmin('System warning');

// システムがエラー状態の場合、エラーを記録し緊急通知を送信
} else {
    alertCriticalError('System error');
}
```

#### 三項演算子のコメントルール

- 三項演算子には、条件と処理内容を簡潔に説明するコメントを記載すること

```javascript
// ユーザーが管理者の場合は管理パネル、それ以外は通常のダッシュボードを表示
const page = isAdmin ? 'AdminPanel' : 'Dashboard';
```

### 7-2. アノテーションコメントの活用

アノテーションコメントを活用し、コードの中に次のタスクや現在の問題点を明確に記載すること
特定の問題や要件を明記することで、開発者間の認識齟齬を防ぐ目的があります

| アノテーション | 説明                                                                           | 使用例                                                    |
|----------------|--------------------------------------------------------------------------------|-----------------------------------------------------------|
| TODO           | 将来的なタスクや改善点を記載します。                                           | `// TODO: 新しいAPIエンドポイントを実装する`              |
| FIXME          | 現在のコードに問題があり、修正が必要であることを記載します。                   | `// FIXME: 非推奨のメソッドを使用しているため要修正`      |
| NOTE           | 特定のコードに関する補足情報や注意点を記載します。                             | `// NOTE: このアルゴリズムは特定の条件下でのみ動作します` |
| HACK           | 一時的な解決策やトリッキーな実装について記載します。                           | `// HACK: パフォーマンスの問題を回避するため暫定対応`     |
| REVIEW         | レビューが必要な箇所や、他の開発者の確認を求める場合に記載します。             | `// REVIEW: このロジックの最適化について意見を求めたい`   |
| DEPRECATED     | 非推奨であることを記載します。将来的に削除される可能性があることを明示します。 | `// DEPRECATED: この関数は廃止予定。代わりに新関数を使用` |

#### 記載例

```javascript
// TODO: APIのエラーハンドリングを追加する
fetchData().catch(handleError);

// FIXME: メモリリークの可能性があるため、この部分をリファクタリングする必要あり
const data = loadLargeDataset();

// NOTE: このアルゴリズムは特定の条件下でのみ動作します
const result = customAlgorithm(inputData);

// HACK: パフォーマンスの問題を回避するため暫定対応
const optimizedResult = temporaryFixForPerformance(inputData);

// REVIEW: このロジックの最適化について意見を求めたい
const finalValue = complexCalculation(values);

// DEPRECATED: この関数は廃止予定。代わりに新関数を使用
oldFunction();
```
