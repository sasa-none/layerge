/**
 * createId - POC用のIDを生成します
 * @param {string} [prefix] - ID生成時のプレフィックス（デフォルトは 'lg'）
 * @returns {string} タイムスタンプとランダム文字列を組み合わせたユニークID
 */
const createId = (prefix = 'lg') => {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

export {createId};
