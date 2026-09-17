import {inject} from 'vue';
import {LayergeKey} from '../internals/keys';

/**
 * useLayerge - Layergeの全体APIを取得します
 * @returns {{mode:string,depth:number,closeTop:(options?:{restoreUrl?:boolean}) => void,closeAll:(options?:{restoreUrl?:boolean}) => void,exit:() => void}} 現在のモード、深さ、操作用メソッドを含むLayergeの外部公開APIオブジェクト
 */
const useLayerge = () => {
    const $layerge = inject(LayergeKey, null) ?? inject('$layerge', null);

    // LayergeStoreが注入されていない場合、デフォルト値を返す（Layerge未使用時の安全な動作保証）
    if (!$layerge) {
        return {
            mode: 'page',
            depth: 0,
            closeTop: () => {},
            closeAll: () => {},
            exit: () => {}
        };
    }

    return {
        get mode() {
            return $layerge.mode;
        },
        get depth() {
            return $layerge.stack.length;
        },
        closeTop: (options) => {
            // 新しいストア形式の場合は内部メソッドを使用
            if (typeof $layerge._closeTop === 'function') {
                $layerge._closeTop(options);
                return;
            }

            // Fallback (older store): close the top handle.
            const top = $layerge.stack[$layerge.stack.length - 1];

            // スタックが空の場合は何もしない
            if (!top) {
                return;
            }

            top.handle.close();
        },
        closeAll: (options) => {
            // 新しいストア形式の場合は内部メソッドを使用
            if (typeof $layerge._closeAll === 'function') {
                $layerge._closeAll(options);
                return;
            }

            // Fallback (older store): close from the end.
            while ($layerge.stack.length > 0) {
                const top = $layerge.stack[$layerge.stack.length - 1];
                top.handle.close();
            }
        },
        exit: () => {
            // Presenter文脈強制終了機能が使用可能な場合のみ実行（履歴は触らない）
            if (typeof $layerge._exitPresenterMode === 'function') {
                $layerge._exitPresenterMode();
            }
        }
    };
};

export {useLayerge};
