/**
 * pack-for-consumers - consumer 検証用に tarball を固定名で生成します
 *
 * npm pack の生成物は layerge-<version>.tgz というバージョン入りの名前になります。
 * consumer-vue-router-4 / -5 がこれを file: 依存で直接参照しているため、
 * 素の名前のままだとバージョンを上げた瞬間に参照が解決できなくなります。
 * そこで生成後に layerge.tgz へ改名し、consumer 側はこの固定名を参照します。
 *
 * 使い方: node scripts/pack-for-consumers.mjs
 */

import {execSync} from 'node:child_process';
import {renameSync, rmSync, existsSync} from 'node:fs';

/**
 * FIXED_NAME - consumer が参照する固定のファイル名
 * @constant
 * @type {string}
 */
const FIXED_NAME = 'layerge.tgz';

// npm の実体は環境によって異なる（Windows の npm.cmd、mise 等の shim）ため、
// 実行ファイルを直接指定せずシェル経由で呼ぶ。引数は固定値のみ。
const stdout = execSync('npm pack --json', {encoding: 'utf8'});
const parsed = JSON.parse(stdout);

if (!Array.isArray(parsed) || parsed.length === 0 || typeof parsed[0].filename !== 'string') {
    throw new Error('[pack-for-consumers] npm pack の出力を解釈できませんでした。');
}

const generated = parsed[0].filename;

if (!existsSync(generated)) {
    throw new Error(`[pack-for-consumers] 生成物が見つかりません: ${generated}`);
}

// 前回の生成物が残っていると rename に失敗する環境があるため、先に消す
if (existsSync(FIXED_NAME)) {
    rmSync(FIXED_NAME);
}

renameSync(generated, FIXED_NAME);

console.info(`[pack-for-consumers] ${generated} -> ${FIXED_NAME}`);
