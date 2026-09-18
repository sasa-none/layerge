/**
 * OutcomeStage - 内部Outcomeの操作種別
 */
export type OutcomeStage = 'open' | 'navigate' | 'close' | 'restore';

/**
 * OutcomeInternalStatus - 内部Outcomeの収束ステータス
 */
export type OutcomeInternalStatus = 'completed' | 'failed' | 'aborted' | 'superseded' | 'blocked';

/**
 * OutcomePublicStatus - Public（利用者向け）ステータス
 */
export type OutcomePublicStatus = 'completed' | 'failed' | 'aborted' | 'superseded';

/**
 * LayergeOutcomeInternal - Layerge内部で扱うOutcome
 */
export interface LayergeOutcomeInternal {
    /** 操作単位のtraceId */
    traceId: string;
    /** 操作種別 */
    stage: OutcomeStage;
    /** 収束ステータス */
    status: OutcomeInternalStatus;
    /** 失敗理由（dev-only） */
    reason?: string | undefined;
}

/**
 * LayergeOutcomePublic - 利用者へ射影するOutcome
 */
export interface LayergeOutcomePublic {
    /** 操作単位のtraceId */
    traceId: string;
    /** Publicステータス */
    status: OutcomePublicStatus;
}

/**
 * projectInternalStatusToPublic - internal status を public status へ射影します
 * - blocked は public では aborted に畳みます
 * @param internalStatus - internal status
 * @returns public status
 */
const projectInternalStatusToPublic = (internalStatus: OutcomeInternalStatus): OutcomePublicStatus => {
    if (internalStatus === 'blocked') {
        return 'aborted';
    }

    // blocked を除いた残りは OutcomePublicStatus と一致するため、キャストは不要
    return internalStatus;
};

/**
 * createInternalOutcome - 内部Outcomeを生成します
 * @param args - args
 * @param args.traceId - 操作単位のtraceId
 * @param args.stage - 操作種別
 * @param args.status - 収束ステータス
 * @param args.reason - 失敗理由（dev-only）
 * @returns outcome
 */
const createInternalOutcome = ({
    traceId,
    stage,
    status,
    reason
}: {
    traceId: string;
    stage: OutcomeStage;
    status: OutcomeInternalStatus;
    reason?: string;
}): LayergeOutcomeInternal => {
    return {
        traceId: traceId,
        stage: stage,
        status: status,
        reason: reason
    };
};

/**
 * projectOutcomeToPublic - 内部OutcomeをPublicへ射影します
 * @param internalOutcome - internal outcome
 * @returns public outcome
 */
const projectOutcomeToPublic = (internalOutcome: LayergeOutcomeInternal): LayergeOutcomePublic => {
    return {
        traceId: internalOutcome.traceId,
        status: projectInternalStatusToPublic(internalOutcome.status)
    };
};

export {createInternalOutcome, projectInternalStatusToPublic, projectOutcomeToPublic};
