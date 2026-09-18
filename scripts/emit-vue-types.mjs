/**
 * emit-vue-types - .vue の型定義を node16 / nodenext が探す名前でも複製します
 *
 * 出荷する index.d.ts は `export {default as LayergeView} from './view/LayergeView.vue'`
 * の形で .vue を参照します。この specifier の解決方法は moduleResolution で異なります。
 *
 * - bundler: `LayergeView.vue.d.ts` を探す（vue-tsc が出力する名前そのもの）
 * - node16 / nodenext: 拡張子を剥がして `LayergeView.d.vue.ts` を探す
 *   （TypeScript が任意拡張子のモジュールに定める名前。ESM / CJS のどちらの条件でも同じ）
 *
 * 後者が無いと、node16 / nodenext の利用者には公開 API が「存在しない」と報告されます
 * （docs/internal/roadmap.ja.md の A-19）。両方の名前で出荷して、どちらの解決方式でも
 * 解決できるようにします。
 *
 * 使い方: node scripts/emit-vue-types.mjs
 */

import {readdirSync, copyFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

/**
 * TYPES_DIR - 型定義の出力先（tsconfig.build.json の outDir と揃える）
 * @constant
 * @type {string}
 */
const TYPES_DIR = 'dist/types';

/**
 * collectVueDeclarations - .vue.d.ts を再帰的に集めます
 * @param dir - 探索するディレクトリ
 * @returns .vue.d.ts のパス一覧
 */
const collectVueDeclarations = (dir) => {
    /** @type {string[]} */
    const found = [];

    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);

        if (statSync(path).isDirectory()) {
            found.push(...collectVueDeclarations(path));
            continue;
        }

        if (path.endsWith('.vue.d.ts')) {
            found.push(path);
        }
    }

    return found;
};

const declarations = collectVueDeclarations(TYPES_DIR);

if (declarations.length === 0) {
    console.error(`[emit-vue-types] ${TYPES_DIR} に .vue.d.ts がありません。先に型定義を生成してください。`);
    process.exit(1);
}

for (const path of declarations) {
    copyFileSync(path, path.replace(/\.vue\.d\.ts$/, '.d.vue.ts'));
}

console.info(`[emit-vue-types] ${declarations.length} ファイルを .d.vue.ts として複製しました`);
