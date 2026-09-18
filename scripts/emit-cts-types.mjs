/**
 * emit-cts-types - 生成した .d.ts を .d.cts として複製します
 *
 * package.json の exports は import / require で型定義を出し分けています。
 * 中身は同一のため、ESM 用に生成した .d.ts をそのまま .d.cts へ複製します
 * （docs/spec-typescript-migration.ja.md 2-3 の決定）。
 *
 * 相対 import は拡張子なしで書かれているため、複製後も .d.cts 側で解決されます。
 * 使い方: node scripts/emit-cts-types.mjs
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
 * collectDeclarations - .d.ts を再帰的に集めます
 * @param dir - 探索するディレクトリ
 * @returns .d.ts のパス一覧
 */
const collectDeclarations = (dir) => {
    /** @type {string[]} */
    const found = [];

    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);

        if (statSync(path).isDirectory()) {
            found.push(...collectDeclarations(path));
            continue;
        }

        if (path.endsWith('.d.ts')) {
            found.push(path);
        }
    }

    return found;
};

const declarations = collectDeclarations(TYPES_DIR);

if (declarations.length === 0) {
    console.error(`[emit-cts-types] ${TYPES_DIR} に .d.ts がありません。先に型定義を生成してください。`);
    process.exit(1);
}

for (const path of declarations) {
    copyFileSync(path, path.replace(/\.d\.ts$/, '.d.cts'));
}

console.info(`[emit-cts-types] ${declarations.length} ファイルを .d.cts として複製しました`);
