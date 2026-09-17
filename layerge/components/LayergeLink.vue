<template>
    <slot v-if="custom" :navigate="navigate" :handler="handler" />

    <a v-else :ref="elRef" :href="href" @click="onClick" @keydown="onKeydown">
        <slot />
    </a>
</template>

<script setup>
import {computed, inject, ref} from 'vue';
import {useRouter} from 'vue-router';
import {isNodeDevEnv} from '../internals/env.js';
import {LayergeKey} from '../internals/keys';

/**
 * LayergeLink - RouterLink互換の最小Link導線
 * - to による導線のみを提供します
 * - custom slot では navigate / handler を提供します
 * - prevent/disabled の挙動は凍結仕様に準拠します
 */

const props = defineProps({
    /** presenter 名（必須） */
    presenter: {type: String, required: true},
    /** action（push/replace/open） */
    action: {type: String, default: 'push'},

    /** RouteLocationRaw (Route mode) */
    to: {type: [String, Object], required: false},
    /** Component (Component mode) */
    component: {type: [Object, Function], required: false},
    /** url (push/replace only; ignored on open) */
    url: {type: [String, Object], required: false},

    /** RouterLink互換：custom slot */
    custom: {type: Boolean, default: false},
    /** preventDefault の制御 */
    prevent: {type: Boolean, default: true},
    /** 起動しない */
    disabled: {type: Boolean, default: false}
});

const router = useRouter();
const $layerge = inject(LayergeKey, null) ?? inject('$layerge', null);

/**
 * elRef - invoker 登録用の DOM 捕捉
 * @type {import('vue').Ref<HTMLElement|null>}
 */
const elRef = ref(null);

/**
 * href - 右クリック/新規タブ等のために href を提供します
 */
const mode = computed(() => {
    const hasTo = props.to != null;
    const hasComponent = props.component != null;
    if (hasTo && hasComponent) {
        console.warn(
            '[LayergeLink] `to` and `component` are mutually exclusive. `to` will be used and `component` will be ignored.'
        );
        return 'route';
    }
    if (hasComponent) {
        return 'component';
    }
    if (hasTo) {
        return 'route';
    }

    console.warn('[LayergeLink] Missing `to` or `component`. This link will be a no-op.');
    return 'none';
});

const href = computed(() => {
    if (mode.value !== 'route') {
        return '#';
    }
    try {
        return router.resolve(props.to).href;
    } catch {
        return '';
    }
});

/**
 * inferEntryIdFromState - 直近の open 操作で作られた entryId を推測します
 * @returns {string|null}
 */
const inferEntryIdFromState = () => {
    if (!$layerge) {
        return null;
    }

    if ($layerge.pending && typeof $layerge.pending.id === 'string') {
        return $layerge.pending.id;
    }

    const top = $layerge.stack?.[$layerge.stack.length - 1];

    if (top && typeof top.id === 'string') {
        return top.id;
    }

    return null;
};

/**
 * resolveInvokerElement - invoker に使用する DOM を決定します
 * @param {unknown} event - click/keydown event
 * @returns {HTMLElement|null}
 */
const resolveInvokerElement = (event) => {
    if (event && typeof event === 'object' && 'currentTarget' in event) {
        const t = event.currentTarget;

        if (t instanceof HTMLElement) {
            return t;
        }
    }

    if (elRef.value instanceof HTMLElement) {
        return elRef.value;
    }

    return null;
};

/**
 * callPresenter - presenter API を呼び出します
 * @param {'push'|'replace'|'open'} kind - 種別
 * @param {unknown} [event] - event
 * @returns {void}
 */
const callPresenter = async (kind, event) => {
    if (props.disabled) {
        return;
    }

    if (mode.value === 'none') {
        return;
    }

    // url is only for push/replace
    if (kind === 'open' && props.url != null) {
        console.warn('[LayergeLink] `url` is ignored when action is "open".');
    }

    const rawTarget = mode.value === 'component' ? props.component : props.to;

    // NOTE:
    // Vue component objects often have a `name` field.
    // In Layerge internals, object targets may be treated as RouteLocationRaw (e.g. `{ name: ... }`).
    // That can cause component-mode open to be misrouted.
    // Normalize component objects to a function to avoid ambiguity.
    const target =
        mode.value === 'component' && rawTarget != null && typeof rawTarget === 'object'
            ? () => rawTarget
            : rawTarget;

    // Layerge API (presenter) - may be undefined.
    const api = router?.[props.presenter];

    /**
     * url option is supported for push/replace.
     *
     * - For Component-mode, we forward it as-is to the presenter.
     * - For Route-mode, we implement "to + url" at the link layer to avoid
     *   changing core semantics: navigate to `url` (history) while opening
     *   `to` in view-only mode.
     */
    const hasUrl = (kind === 'push' || kind === 'replace') && props.url != null;
    const options = hasUrl ? {url: props.url} : undefined;

    if (mode.value === 'route' && hasUrl) {
        if (isNodeDevEnv()) {
            // url is only meaningful for push/replace; we already checked kind.
            // Make sure "to" exists.
            if (props.to == null) {
                console.warn('[Layerge] <LayergeLink>: url was provided but "to" is missing.');
                return;
            }
        }

        const routerAction = kind === 'replace' ? 'replace' : 'push';
        const current = router?.currentRoute?.value;

        /** @type {import('vue-router').RouteLocationRaw} */
        let navTarget;
        if (typeof props.url === 'string') {
            navTarget = props.url;
        } else {
            // Partial RouteLocationRaw: merge with current route.
            // If path/name are explicitly provided, prefer them.
            const urlObj = props.url;
            if (urlObj && (urlObj.path != null || urlObj.name != null)) {
                navTarget = urlObj;
            } else {
                navTarget = {
                    ...(current ?? {}),
                    ...(urlObj ?? {}),
                    query: {...(current?.query ?? {}), ...(urlObj?.query ?? {})},
                    hash: urlObj?.hash ?? current?.hash
                };
            }
        }

        // First push/replace URL (history), then open the route in view-only.
        router?.[routerAction](navTarget)
            .then(() => {
                try {
                    if (api && typeof api.open === 'function') {
                        api.open(/** @type {any} */ (props.to));
                    }

                    // invoker 登録（凍結仕様：entryId ↔ el の接続点）
                    if ($layerge && typeof $layerge._setInvoker === 'function') {
                        const entryId = inferEntryIdFromState();
                        const invokerEl = resolveInvokerElement(event);
                        if (entryId && invokerEl) {
                            $layerge._setInvoker(entryId, invokerEl);
                        }
                    }
                } catch {
                    // Ignore. This mirrors normal click behavior where navigation could still occur.
                }
            })
            .catch(() => {
                // If URL navigation fails, do nothing.
            });

        return;
    }

    // Layerge 連携が無い場合も従来挙動を壊さない

    if (api && typeof api[kind] === 'function') {
        try {
            if (options) {
                await api[kind](target, options);
            } else {
                await api[kind](target);
            }
        } catch {
            // ここでは例外を握りつぶす（Linkは通知責務を持たない）
        }
    } else {
        // フォールバック：Router の push/replace だけは最低限動かす
        try {
            if (mode.value === 'route') {
                if (kind === 'replace') {
                    router.replace(target);
                } else if (kind === 'push') {
                    router.push(target);
                }
            }
        } catch {
            // no-op
        }
    }

    // invoker 登録（凍結仕様：entryId ↔ el の接続点）
    if ($layerge && typeof $layerge._setInvoker === 'function') {
        const entryId = inferEntryIdFromState();
        const invokerEl = resolveInvokerElement(event);

        if (entryId && invokerEl) {
            $layerge._setInvoker(entryId, invokerEl);
        }
    }
};

/**
 * handler - to に束縛された push/replace/open
 */
const handler = {
    open: (event) => {
        callPresenter('open', event);
    },
    push: (event) => {
        callPresenter('push', event);
    },
    replace: (event) => {
        callPresenter('replace', event);
    }
};

/**
 * navigate - action 指定メソッドを呼び出します
 * @param {unknown} [event] - click/keydown event
 * @returns {void}
 */
const navigate = (event) => {
    /** @type {'push'|'replace'|'open'} */
    const kind = props.action === 'replace' || props.action === 'open' ? props.action : 'push';
    handler[kind](event);
};

/**
 * shouldBypassPrevent - prevent=false で meta/ctrl の場合のみ通常リンク挙動
 * @param {MouseEvent} event
 * @returns {boolean}
 */
const shouldBypassPrevent = (event) => {
    // component-mode does not have a meaningful browser navigation target
    if (mode.value === 'component') {
        return false;
    }

    if (props.prevent) {
        return false;
    }

    // 左クリック以外は通常挙動に任せる
    if (typeof event.button === 'number' && event.button !== 0) {
        return true;
    }

    return !!(event.metaKey || event.ctrlKey);
};

/**
 * onClick - click 導線
 * @param {MouseEvent} event
 */
const onClick = (event) => {
    if (props.disabled) {
        event?.preventDefault?.();
        return;
    }

    if (shouldBypassPrevent(event)) {
        // meta/ctrl の場合は通常リンク挙動
        return;
    }

    event?.preventDefault?.();
    navigate(event);
};

/**
 * onKeydown - keyboard 導線
 * @param {KeyboardEvent} event
 */
const onKeydown = (event) => {
    if (props.disabled) {
        return;
    }

    if (!event || typeof event.key !== 'string') {
        return;
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    event?.preventDefault?.();
    navigate(event);
};
</script>
