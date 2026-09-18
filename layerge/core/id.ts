/**
 * createId - POC用のIDを生成します
 * @param prefix - ID生成時のプレフィックス（デフォルトは 'lg'）
 * @returns タイムスタンプとランダム文字列を組み合わせたユニークID
 */
const createId = (prefix = 'lg'): string => {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

export {createId};
