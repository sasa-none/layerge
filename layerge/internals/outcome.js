/**
 * OutcomeStage - 内部Outcomeの操作種別
 * @typedef {'open'|'navigate'|'close'|'restore'} OutcomeStage
 */

/**
 * OutcomeInternalStatus - 内部Outcomeの収束ステータス
 * @typedef {'completed'|'failed'|'aborted'|'superseded'|'blocked'} OutcomeInternalStatus
 */

/**
 * OutcomePublicStatus - Public（利用者向け）ステータス
 * @typedef {'completed'|'failed'|'aborted'|'superseded'} OutcomePublicStatus
 */

/**
 * LayergeOutcomeInternal - Layerge内部で扱うOutcome
 * @typedef {object} LayergeOutcomeInternal
 * @property {string} traceId - 操作単位のtraceId
 * @property {OutcomeStage} stage - 操作種別
 * @property {OutcomeInternalStatus} status - 収束ステータス
 * @property {string|undefined} [reason] - 失敗理由（dev-only）
 */

/**
 * LayergeOutcomePublic - 利用者へ射影するOutcome
 * @typedef {object} LayergeOutcomePublic
 * @property {string} traceId - 操作単位のtraceId
 * @property {OutcomePublicStatus} status - Publicステータス
 */

/**
 * projectInternalStatusToPublic - internal status を public status へ射影します
 * - blocked は public では aborted に畳みます
 * @param {OutcomeInternalStatus} internalStatus - internal status
 * @returns {OutcomePublicStatus} public status
 */
const projectInternalStatusToPublic = (internalStatus) => {
    if (internalStatus === 'blocked') {
        return 'aborted';
    }

    /** @type {OutcomePublicStatus} */
    const status = /** @type {any} */ (internalStatus);
    return status;
};

/**
 * createInternalOutcome - 内部Outcomeを生成します
 * @param {{traceId: string, stage: OutcomeStage, status: OutcomeInternalStatus, reason?: string}} args - args
 * @returns {LayergeOutcomeInternal} outcome
 */
const createInternalOutcome = ({traceId, stage, status, reason}) => {
    return {
        traceId: traceId,
        stage: stage,
        status: status,
        reason: reason
    };
};

/**
 * projectOutcomeToPublic - 内部OutcomeをPublicへ射影します
 * @param {LayergeOutcomeInternal} internalOutcome - internal outcome
 * @returns {LayergeOutcomePublic} public outcome
 */
const projectOutcomeToPublic = (internalOutcome) => {
    return {
        traceId: internalOutcome.traceId,
        status: projectInternalStatusToPublic(internalOutcome.status)
    };
};

export {createInternalOutcome, projectInternalStatusToPublic, projectOutcomeToPublic};
