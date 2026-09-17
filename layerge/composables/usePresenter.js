import {inject} from 'vue';
import {PresenterContextKey} from '../internals/keys';

/**
 * usePresenter - Presenterコンテキストを取得します
 * - Presenter上ならhandle/entry/isTopを返します
 * - Page上ならno-opを返します（分岐不要）
 * @returns {{handle:import('../types').PresenterHandle,entry:import('../types').PresenterEntry|null,isTop:boolean}} Presenterハンドル、エントリ情報、最上位判定を含むPresenterコンテキストオブジェクト
 */
const usePresenter = () => {
    const ctxRef = inject(PresenterContextKey, null);

    /**
     * noopHandle - Presenterコンテキストが存在しない場合のデフォルトハンドル
     * @constant
     * @type {import('../types').PresenterHandle}
     */
    const noopHandle = {
        close: () => {},
        closed: Promise.resolve(),
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
