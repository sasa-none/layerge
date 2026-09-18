<template>
    <!--
      v1.x: 利用者が notify を書かなくても leave が成立するように、
      EntryContext.phase に応じて内部で表示/非表示を切り替える。

      - enter/active: slot を表示（enter/appear は after-* で notifyEnterDone）
      - leave: slot を非表示（leave が走り、after-leave で notifyLeaveDone）
    -->
    <!--
      NOTE:
      <Transition> requires a single direct child vnode.
      Using <template v-if> here creates a Fragment and can prevent hooks
      (after-enter/after-leave) from firing in some cases.
      We put v-if on <slot> itself to keep a single child.
    -->
    <Transition v-bind="transitionAttrs">
        <slot v-if="shouldRender" />
    </Transition>
</template>

<script setup lang="ts">
import {computed, inject, shallowReactive, onBeforeUnmount, onMounted, useAttrs} from 'vue';
import {isNodeDevEnv} from '../internals/env.js';
import {EntryContextKey, LayergeKey} from '../internals/keys.js';
import type {LayergeEntryContext, LayergeStore} from '../types.js';

defineOptions({
    inheritAttrs: false
});

const attrs = useAttrs();
/**
 * entry - Presenter 配下の公開ステート（EntryContext）
 */
let entry: LayergeEntryContext | null = inject(EntryContextKey, null);

if (!entry) {
    // dev では明確に失敗させて誤用に気づけるようにする
    if (isNodeDevEnv()) {
        throw new Error(
            '[LayergeTransition] EntryContext is not provided. Place this inside a presenter component.'
        );
    }

    // production では安全なダミーを使う（誤用時でも破壊的クラッシュを避ける）
    entry = shallowReactive({
        entryId: '',
        phase: 'active',
        index: 0,
        depth: 0,
        isTop: false
    });
}
const $layerge = inject(LayergeKey, null) ?? inject<LayergeStore | null>('$layerge', null);

// v1.x: この entry は LayergeTransition により enter/leave を管理される。
// Transition 未使用の場合は Router 側が自動で notify するため、ここで「管理対象」として登録する。
onMounted(() => {
    try {
        if ($layerge && $layerge._transitionManagedEntryIds) {
            $layerge._transitionManagedEntryIds.add(entry.entryId);
        }
    } catch {
        // ignore
    }
});

onBeforeUnmount(() => {
    try {
        if ($layerge && $layerge._transitionManagedEntryIds) {
            $layerge._transitionManagedEntryIds.delete(entry.entryId);
        }
    } catch {
        // ignore
    }
});

/**
 * shouldRender - slot を描画するか
 * @returns 描画する場合 true
 */
const shouldRender = computed(() => {
    // phase が leave になったら非表示にして leave を発火させる
    return entry.phase !== 'leave';
});

/**
 * normalizeHandlers - Transition hook を配列に正規化します
 * @param handlers - ユーザ指定の hook（関数 or 配列）
 * @returns 呼び出し可能な関数配列
 */
const normalizeHandlers = (handlers: unknown): ((...args: unknown[]) => unknown)[] => {
    if (!handlers) {
        return [];
    }

    if (Array.isArray(handlers)) {
        return handlers.filter((fn) => {
            return typeof fn === 'function';
        });
    }

    if (typeof handlers === 'function') {
        return [handlers as (...args: unknown[]) => unknown];
    }

    return [];
};

/**
 * runHandlers - hook を順に実行します
 * @param handlers - ユーザ指定の hook（関数 or 配列）
 * @param args - Transition hook の引数
 */
const runHandlers = (handlers: unknown, args: unknown[]): void => {
    const fns = normalizeHandlers(handlers);

    for (const fn of fns) {
        fn(...args);
    }
};

/**
 * notifyEnterDone - enter/appear 完了通知（内部）
 */
const notifyEnterDone = (): void => {
    if ($layerge && typeof $layerge._notifyEnterDone === 'function') {
        $layerge._notifyEnterDone(entry.entryId);
    }
};

/**
 * notifyLeaveDone - leave 完了通知（内部）
 */
const notifyLeaveDone = (): void => {
    if ($layerge && typeof $layerge._notifyLeaveDone === 'function') {
        $layerge._notifyLeaveDone(entry.entryId);
    }
};

const transitionAttrs = computed(() => {
    const merged: Record<string, unknown> = {
        ...attrs
    };

    const userAfterEnter = merged.onAfterEnter;
    const userAfterAppear = merged.onAfterAppear;
    const userAfterLeave = merged.onAfterLeave;

    merged.onAfterEnter = (...args: unknown[]) => {
        // after-enter: internal notify -> user hook
        notifyEnterDone();
        runHandlers(userAfterEnter, args);
    };

    merged.onAfterAppear = (...args: unknown[]) => {
        // after-appear: internal notify -> user hook
        notifyEnterDone();
        runHandlers(userAfterAppear, args);
    };

    merged.onAfterLeave = (...args: unknown[]) => {
        // after-leave: user hook -> internal notify
        try {
            runHandlers(userAfterLeave, args);
        } finally {
            notifyLeaveDone();
        }
    };

    return merged;
});
</script>
