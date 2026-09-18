import {inject} from 'vue';
import type {Ref} from 'vue';
import {PresenterContextKey} from '../internals/keys.js';
import type {PresenterEntry, PresenterHandle} from '../types.js';

/**
 * PresenterContextValue - LayergeView が provide する Presenter コンテキストの形
 *
 * PresenterContextKey は InjectionKey<unknown> のため、受け取り側で形を与えます。
 */
interface PresenterContextValue {
    handle?: PresenterHandle;
    entry?: PresenterEntry | null;
    isTop?: boolean;
}

/**
 * usePresenter - Presenterコンテキストを取得します
 * - Presenter上ならhandle/entry/isTopを返します
 * - Page上ならno-opを返します（分岐不要）
 * @returns Presenterハンドル、エントリ情報、最上位判定を含むPresenterコンテキストオブジェクト
 */
const usePresenter = (): {handle: PresenterHandle; entry: PresenterEntry | null; isTop: boolean} => {
    const ctxRef = inject(PresenterContextKey, null) as Ref<PresenterContextValue | null> | null;

    /**
     * noopHandle - Presenterコンテキストが存在しない場合のデフォルトハンドル
     *
     * 呼び出し側に分岐を強いないため、PresenterHandle の全メンバーを満たします。
     * settled は「何も起きなかった」を表す aborted で即座に解決します
     * （内部の blocked を公開面で aborted に畳む規則に合わせています）。
     * @constant
     */
    const noopHandle: PresenterHandle = {
        close: () => {},
        closed: Promise.resolve(),
        settled: Promise.resolve({status: 'aborted'}),
        isActive: false
    };

    return {
        get handle() {
            // Presenterコンテキストが存在する場合は実際のhandle、存在しない場合はnoopHandleを返す
            const ctx = ctxRef ? ctxRef.value : null;
            return ctx && ctx.handle ? ctx.handle : noopHandle;
        },
        get entry() {
            // Presenterコンテキストが存在する場合は実際のentry、存在しない場合はnullを返す
            const ctx = ctxRef ? ctxRef.value : null;
            return ctx && ctx.entry ? ctx.entry : null;
        },
        get isTop() {
            // Presenterコンテキストが存在し、かつ最上位の場合のみtrueを返す
            const ctx = ctxRef ? ctxRef.value : null;
            return !!(ctx && ctx.isTop === true);
        }
    };
};

export {usePresenter};
