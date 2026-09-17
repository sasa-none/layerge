/**
 * smoke-dist - ビルド成果物（dist/）が実際に読み込めることを検証します
 *
 * 単体テストも E2E も layerge/ の**ソース**を対象にしており
 * （demo/vite.config.js が layerge をソースへ alias しています）、
 * dist/ の中身を実行する検証はどこにもありません。
 * そのため vite の設定ミスで成果物が壊れても CI は緑のまま通ってしまいます。
 *
 * ここでは ESM / CJS の双方を実際に読み込み、公開エクスポートが
 * 揃っていることだけを確認します。挙動そのものの検証は単体テストと E2E の責務です。
 *
 * 使い方: node scripts/smoke-dist.mjs（事前に pnpm build が必要）
 */

import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';

/**
 * EXPECTED_EXPORTS - layerge/index.js が公開しているエクスポート
 * @constant
 * @type {string[]}
 */
const EXPECTED_EXPORTS = [
    'createLayergeRouter',
    'LayergeView',
    'LayergeTransition',
    'LayergeLink',
    'usePresenter',
    'useLayerge',
    'usePresenterBindings',
    'useLayergeLink',
    'usePresenterLeaveGuard'
];

/**
 * collectProblems - 読み込んだモジュールに欠けているエクスポートを列挙します
 * @param {string} label - 表示用のラベル（ESM / CJS）
 * @param {Record<string, unknown>} mod - 読み込んだモジュール
 * @returns {string[]} 問題の一覧（無ければ空配列）
 */
const collectProblems = (label, mod) => {
    /** @type {string[]} */
    const problems = [];

    for (const name of EXPECTED_EXPORTS) {
        if (!(name in mod)) {
            problems.push(`${label}: エクスポートが無い -> ${name}`);
            continue;
        }

        // Component は object、composable と factory は function で公開される
        const value = mod[name];
        const type = typeof value;

        if (value === undefined || (type !== 'function' && type !== 'object')) {
            problems.push(`${label}: ${name} の型が不正 -> ${type}`);
        }
    }

    return problems;
};

const esmPath = new URL('../dist/index.mjs', import.meta.url);
const cjsPath = new URL('../dist/index.cjs', import.meta.url);

for (const path of [esmPath, cjsPath]) {
    if (!existsSync(path)) {
        console.error(`[smoke-dist] 成果物がありません: ${path.pathname}`);
        console.error('  先に pnpm build を実行してください。');
        process.exit(1);
    }
}

const esm = await import(esmPath.href);

const require = createRequire(import.meta.url);
const cjs = require('../dist/index.cjs');

const problems = [...collectProblems('ESM', esm), ...collectProblems('CJS', cjs)];

if (problems.length > 0) {
    console.error('[smoke-dist] ビルド成果物の公開エクスポートが想定と一致しません。');

    for (const problem of problems) {
        console.error(`  - ${problem}`);
    }

    process.exit(1);
}

console.info(`[smoke-dist] OK: ESM / CJS ともに公開エクスポート ${EXPECTED_EXPORTS.length} 個を確認`);
