/**
 * DEFAULT_STRESS_ITERS - stress 反復回数の既定値
 * @constant
 * @type {number}
 */
const DEFAULT_STRESS_ITERS = 20;

/**
 * MAX_STRESS_ITERS - 誤設定による暴走ループを防ぐ上限
 * @constant
 * @type {number}
 */
const MAX_STRESS_ITERS = 1000;

/**
 * readStressIters - stress 反復回数を env から取得します
 * @returns {number} 反復回数（default: 20）
 */
export const readStressIters = () => {
    const raw = process.env.LAYERGE_E2E_STRESS_ITERS;
    const n = raw ? Number(raw) : NaN;

    if (!Number.isFinite(n) || n <= 0) {
        return DEFAULT_STRESS_ITERS;
    }

    // 誤設定で極端に重くならないようにガード
    return Math.min(Math.floor(n), MAX_STRESS_ITERS);
};
