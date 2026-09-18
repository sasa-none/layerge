import {describe, expect, it} from 'vitest';
import {createApp} from 'vue';

import {usePresenter} from '../layerge/composables/usePresenter';

/**
 * runOutsidePresenter - Presenter 配下でない文脈で composable を実行します
 *
 * runWithContext を使うと inject() が既定値を返せるため、
 * setup() の外から呼んだ場合の警告を出さずに no-op 経路を検証できます。
 * @param {() => T} fn - 実行する関数
 * @returns {T} 実行結果
 * @template T
 */
const runOutsidePresenter = (fn) => {
    const app = createApp({});

    return app.runWithContext(fn);
};

describe('composables/usePresenter (no-op handle)', () => {
    it('resolves settled as aborted outside a presenter (no branching required)', async () => {
        const presenter = runOutsidePresenter(() => usePresenter());

        // Presenter 配下ではないため entry は無く、最上段でもない
        expect(presenter.entry).toBe(null);
        expect(presenter.isTop).toBe(false);

        // settled は「何も起きなかった」を aborted として即座に解決する
        await expect(presenter.handle.settled).resolves.toEqual({status: 'aborted'});
    });

    it('keeps the rest of the handle usable without branching', async () => {
        const presenter = runOutsidePresenter(() => usePresenter());

        expect(presenter.handle.isActive).toBe(false);

        // close() は no-op（例外を投げない）
        expect(() => {
            presenter.handle.close();
        }).not.toThrow();

        await expect(presenter.handle.closed).resolves.toBeUndefined();
    });

    it('exposes the same public status values as a real handle', async () => {
        const presenter = runOutsidePresenter(() => usePresenter());
        const result = await presenter.handle.settled;

        // 公開ステータスは 4 値に固定されている
        expect(['completed', 'aborted', 'failed', 'superseded']).toContain(result.status);
    });
});
