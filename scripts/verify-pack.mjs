/**
 * verify-pack - npm pack に含まれるファイル一式を検証します
 *
 * package.json の files フィールドは公開物の唯一の定義元ですが、
 * .gitignore で dist/ を除外しているため「意図せず dist が落ちる」事故が起こり得ます。
 * CI でこのスクリプトを実行し、公開物の構成が変わっていないことを機械的に確認します。
 *
 * 公開物を意図的に増減させた場合は、下の EXPECTED_FILES を更新してください。
 * 使い方: node scripts/verify-pack.mjs
 */

import {execSync} from 'node:child_process';

/**
 * EXPECTED_FILES - tarball に含まれているべきファイル（tarball 内の相対パス）
 * @constant
 * @type {string[]}
 */
const EXPECTED_FILES = [
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
    'dist/index.cjs',
    'dist/index.mjs',
    'dist/types/components/LayergeLink.d.vue.ts',
    'dist/types/components/LayergeLink.vue.d.cts',
    'dist/types/components/LayergeLink.vue.d.ts',
    'dist/types/composables/useLayerge.d.cts',
    'dist/types/composables/useLayerge.d.ts',
    'dist/types/composables/useLayergeLink.d.cts',
    'dist/types/composables/useLayergeLink.d.ts',
    'dist/types/composables/usePresenter.d.cts',
    'dist/types/composables/usePresenter.d.ts',
    'dist/types/composables/usePresenterBindings.d.cts',
    'dist/types/composables/usePresenterBindings.d.ts',
    'dist/types/composables/usePresenterLeaveGuard.d.cts',
    'dist/types/composables/usePresenterLeaveGuard.d.ts',
    'dist/types/core/handle.d.cts',
    'dist/types/core/handle.d.ts',
    'dist/types/core/id.d.cts',
    'dist/types/core/id.d.ts',
    'dist/types/core/store.d.cts',
    'dist/types/core/store.d.ts',
    'dist/types/index.d.cts',
    'dist/types/index.d.ts',
    'dist/types/internals/decisionTrace.d.cts',
    'dist/types/internals/decisionTrace.d.ts',
    'dist/types/internals/devMetrics.d.cts',
    'dist/types/internals/devMetrics.d.ts',
    'dist/types/internals/env.d.cts',
    'dist/types/internals/env.d.ts',
    'dist/types/internals/keys.d.cts',
    'dist/types/internals/keys.d.ts',
    'dist/types/internals/outcome.d.cts',
    'dist/types/internals/outcome.d.ts',
    'dist/types/router/createLayergeRouter.d.cts',
    'dist/types/router/createLayergeRouter.d.ts',
    'dist/types/types.d.cts',
    'dist/types/types.d.ts',
    'dist/types/view/LayergeTransition.d.vue.ts',
    'dist/types/view/LayergeTransition.vue.d.cts',
    'dist/types/view/LayergeTransition.vue.d.ts',
    'dist/types/view/LayergeView.d.vue.ts',
    'dist/types/view/LayergeView.vue.d.cts',
    'dist/types/view/LayergeView.vue.d.ts',
    'package.json'
];

/**
 * readPackResult - npm pack --dry-run --json の結果を取得します
 * @returns {{name: string, version: string, files: {path: string, size: number}[]}} pack の結果
 */
const readPackResult = () => {
    // npm の実体は環境によって異なる（Windows の npm.cmd、mise 等の shim）ため、
    // 実行ファイルを直接指定せずシェル経由で呼ぶ。引数は固定値のみ。
    // --dry-run なので tarball は書き出されない
    const stdout = execSync('npm pack --dry-run --json', {encoding: 'utf8'});

    const parsed = JSON.parse(stdout);

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('[verify-pack] npm pack の出力を解釈できませんでした。');
    }

    return parsed[0];
};

const result = readPackResult();
const actualFiles = result.files.map((file) => file.path).sort();
const expectedFiles = [...EXPECTED_FILES].sort();

/** @type {string[]} */
const problems = [];

for (const file of expectedFiles) {
    if (!actualFiles.includes(file)) {
        problems.push(`欠落: ${file}`);
    }
}

for (const file of actualFiles) {
    if (!expectedFiles.includes(file)) {
        problems.push(`余分: ${file}`);
    }
}

// サイズ 0 のファイルはビルド失敗の兆候なので落とす
for (const file of result.files) {
    if (file.size === 0) {
        problems.push(`サイズが 0: ${file.path}`);
    }
}

if (problems.length > 0) {
    console.error(`[verify-pack] ${result.name}@${result.version} の公開物が想定と一致しません。`);

    for (const problem of problems) {
        console.error(`  - ${problem}`);
    }

    console.error('  想定を変更した場合は scripts/verify-pack.mjs の EXPECTED_FILES を更新してください。');
    process.exit(1);
}

console.info(`[verify-pack] OK: ${result.name}@${result.version} / ${actualFiles.length} ファイル`);

for (const file of actualFiles) {
    console.info(`  - ${file}`);
}
