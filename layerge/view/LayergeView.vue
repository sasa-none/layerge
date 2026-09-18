<template>
    <Suspense>
        <router-view v-bind="baseRouterViewProps" />
        <template #fallback><slot /></template>
    </Suspense>

    <template v-if="hasOverlay">
        <!--
          v1.x: "leaving" は DOM を保持するための集合。
          ただし「stack -> leaving へ移動」する瞬間に、
          key が変わると remove+add になり "閉じたのに再表示" が起きる。
          そのため、描画対象は 1つのリストとして扱い、key は常に entry.id を使う。
        -->
        <PresenterLayer
            v-for="entry in renderEntries"
            :key="entry._mountKey ?? entry.id"
            :entry="entry"
            :presenter-component="presenterComponentOf(entry)"
            :is-top="isTopEntry(entry)"
            :index="entryIndex(entry)"
            :depth="entryDepth(entry)"
        />
    </template>
</template>

<script setup lang="ts">
import {computed, defineComponent, h, inject, provide, shallowReactive, shallowRef} from 'vue';
import type {Component, PropType} from 'vue';
import {RouterView} from 'vue-router';
import {PresenterContextKey, EntryContextKey, LayergeKey} from '../internals/keys';
import type {
    LayergeEntryContext,
    LayergeEntryPhase,
    LayergeStore,
    PresenterDefinition,
    PresenterEntry
} from '../types';

const $layerge = inject<LayergeStore | null>('$layerge', null) ?? inject(LayergeKey, null);

if (!$layerge) {
    throw new Error('[LayergeView] $layerge is not provided.');
}

const top = computed(() => {
    const stack = $layerge.stack;

    if (!stack || stack.length === 0) {
        return null;
    }

    return stack[stack.length - 1];
});

const hasOverlay = computed(() => {
    const stackLen = $layerge.stack ? $layerge.stack.length : 0;
    const leavingLen = $layerge.leaving ? $layerge.leaving.length : 0;
    const keptLen = $layerge._kept ? $layerge._kept.length : 0;
    return stackLen > 0 || leavingLen > 0 || keptLen > 0;
});

const activeTopId = computed(() => {
    const stack = $layerge.stack;

    if (!stack || stack.length === 0) {
        return null;
    }

    return stack[stack.length - 1].id;
});

const baseRouterViewProps = computed(() => {
    if ($layerge.freezeBackground === true && $layerge.backgroundRoute) {
        return {route: $layerge.backgroundRoute};
    }

    return {};
});

/**
 * presenterDefOf - entryからPresenter定義を取得します
 * @param entry - Presenterエントリ
 * @returns 定義（存在しない場合はnull）
 */
const presenterDefOf = (entry: PresenterEntry | null): PresenterDefinition | null => {
    if (!entry) {
        return null;
    }

    const def = $layerge.presenters ? $layerge.presenters[entry.presenterName] : null;

    if (!def || !def.component) {
        return null;
    }

    return def;
};

/**
 * presenterComponentOf - entryからPresenterコンポーネントを取得します
 * @param entry - Presenterエントリ
 * @returns Presenterコンポーネント（存在しない場合は'div'）
 */
const presenterComponentOf = (entry: PresenterEntry | null): Component | string => {
    const def = presenterDefOf(entry);

    if (!def) {
        return 'div';
    }

    return def.component;
};

/**
 * stackVisible - 「積層表示」を有効にするか
 * - v1: stack && cache のときだけ “全段表示 + freeze” を行う（迷わせない）
 */
const stackVisible = computed(() => {
    const topEntry = top.value;

    if (!topEntry) {
        return false;
    }

    const def = presenterDefOf(topEntry);

    if (!def) {
        return false;
    }

    return def.stack === true && def.cache === true;
});

/**
 * PresenterLayer - レイヤー1枚を描画（entryごとに provide）
 *
 * v1.x: LayergeView は headless。
 * - Z順・CSS・pointer-events 等の視覚/操作の責務は Presenter 側に委譲する。
 * - Layerge は「描画対象の列挙」と「EntryContext の提供」に徹する。
 */
const PresenterLayer = defineComponent({
    name: 'PresenterLayer',
    props: {
        entry: {type: Object as PropType<PresenterEntry>, required: true},
        presenterComponent: {
            type: [Object, String, Function] as PropType<Component | string>,
            required: true
        },
        isTop: {type: Boolean, required: true},
        index: {type: Number, required: true},
        depth: {type: Number, required: true}
    },
    setup(props) {
        const ctxRef = shallowRef<{
            entry: PresenterEntry;
            handle: PresenterEntry['handle'];
            isTop: boolean;
        } | null>(null);

        /**
         * entryContext - Presenter 配下の公開ステート（EntryContext）
         */
        const entryContext: LayergeEntryContext = shallowReactive({
            entryId: '',
            phase: 'active',
            index: 0,
            depth: 0,
            isTop: false
        });

        provide(PresenterContextKey, ctxRef);
        provide(EntryContextKey, entryContext);

        /**
         * normalizePhase - phase を正規化します
         * @param phase - 受け取った phase
         * @returns 正規化した phase
         */
        const normalizePhase = (phase: unknown): LayergeEntryPhase => {
            if (phase === 'enter' || phase === 'active' || phase === 'leave') {
                return phase;
            }

            return 'active';
        };

        return () => {
            const mountKey =
                props.entry && typeof props.entry._mountKey === 'string' && props.entry._mountKey.length > 0
                    ? props.entry._mountKey
                    : props.entry.id;

            ctxRef.value = {
                entry: props.entry,
                handle: props.entry.handle,
                isTop: props.isTop
            };

            entryContext.entryId = props.entry.id;
            entryContext.phase = normalizePhase(props.entry.phase);
            entryContext.index = props.index;
            entryContext.depth = props.depth;
            entryContext.isTop = props.isTop;

            const presenter = h(
                props.presenterComponent,
                {
                    style: props.entry && props.entry._isHidden ? {display: 'none'} : undefined
                },
                {
                    default: () => {
                        // Component/loader target の場合は entry.viewComponent を描画
                        if (props.entry && props.entry.viewComponent) {
                            const View = props.entry.viewComponent;
                            return h(View, {key: mountKey});
                        }

                        // RouteLocationRaw target の場合は RouterView を描画
                        return h(
                            RouterView,
                            {route: props.entry.route},
                            {
                                default: ({Component}) => {
                                    if (!Component) {
                                        return null;
                                    }

                                    const child = h(Component, {key: mountKey});
                                    return child;
                                }
                            }
                        );
                    }
                }
            );

            return presenter;
        };
    }
});

/**
 * visibleStackEntries - stackVisibleのときは全段、そうでなければtopのみ
 */
const visibleStackEntries = computed(() => {
    const stack = $layerge.stack ?? [];

    if (stack.length === 0) {
        return [];
    }

    if (stackVisible.value) {
        return stack;
    }

    return [stack[stack.length - 1]];
});

/**
 * renderEntries - 表示中（stack）とleave中（leaving）の結合
 * - leavingはstackVisibleに関係なく必ず描画対象
 */
const renderEntries = computed(() => {
    const stackPart = visibleStackEntries.value;
    const leavingPart = $layerge.leaving ?? [];
    const keptPart = $layerge._kept ?? [];

    // NOTE: kept は stack/leaving と重複しない前提だが、保険としてidで重複排除する
    const seen = new Set<string>();
    const out: PresenterEntry[] = [];
    for (const e of [...stackPart, ...leavingPart, ...keptPart]) {
        if (!e || typeof e.id !== 'string') {
            continue;
        }
        const k = e.id;
        if (seen.has(k)) {
            continue;
        }
        seen.add(k);
        out.push(e);
    }
    return out;
});

/**
 * isLeavingEntry - entryがleave中か判定します
 * @param entry - Presenterエントリ
 * @returns leave中の場合true
 */
const isLeavingEntry = (entry: PresenterEntry): boolean => {
    return entry && entry.phase === 'leave';
};

/**
 * entryIndex - EntryContextのindexを決定します
 * @param entry - Presenterエントリ
 * @returns エントリの表示順index
 */
const entryIndex = (entry: PresenterEntry): number => {
    if (isLeavingEntry(entry) && typeof entry._leavingIndex === 'number') {
        return entry._leavingIndex;
    }

    const index = $layerge.stack ? $layerge.stack.findIndex((stackEntry) => stackEntry.id === entry.id) : -1;
    return index >= 0 ? index : 0;
};

/**
 * entryDepth - EntryContextのdepthを決定します
 * @param entry - Presenterエントリ
 * @returns スタックの深さ
 */
const entryDepth = (entry: PresenterEntry): number => {
    if (isLeavingEntry(entry) && typeof entry._leavingDepth === 'number') {
        return entry._leavingDepth;
    }

    return $layerge.stack ? $layerge.stack.length : 0;
};

/**
 * isTopEntry - EntryContextのisTopを決定します
 * @param entry - Presenterエントリ
 * @returns 最上位エントリの場合true
 */
const isTopEntry = (entry: PresenterEntry): boolean => {
    // stack が存在するなら、その top のみが isTop
    if ($layerge.stack && $layerge.stack.length > 0) {
        return activeTopId.value === entry.id;
    }

    // stack が空で leaving のみ残っている場合は、最後の leaving を top 扱い
    const leaving = $layerge.leaving ?? [];
    if (leaving.length === 0) {
        return false;
    }

    return leaving[leaving.length - 1].id === entry.id;
};
</script>
