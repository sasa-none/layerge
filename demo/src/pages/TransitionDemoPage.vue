<template>
    <PageShell title="Transition / EntryContext Demo">
        <div class="Root" data-testid="transition-demo-page">
            <p class="Help">
                What this page shows:
                <strong>LayergeView headless</strong>
                ,
                <strong>EntryContext (usePresenterBindings)</strong>
                ,
                <strong>leaving DOM retention</strong>
                , and
                <strong>&lt;LayergeTransition&gt;</strong>
                .
            </p>

            <div class="Block">
                <h2 class="SubTitle">Modal (display: top) — stackVisible=false behavior</h2>
                <p class="Help">
                    Only the top entry is rendered, but leaving entries are still rendered until
                    <code>after-leave</code>
                    notifies completion.
                </p>

                <div class="Buttons">
                    <button type="button" class="Btn" data-testid="open-modal-transition" @click="openModal">
                        modal.open(TransitionDemoContent)
                    </button>
                    <button
                        type="button"
                        class="Btn"
                        data-testid="open-modal-no-transition"
                        @click="openModalNoTransition"
                    >
                        modalNoTransition.open(TransitionDemoContent)
                    </button>
                    <button
                        type="button"
                        class="Btn"
                        data-testid="open-modal-hooks-transition"
                        @click="openModalWithHooks"
                    >
                        modalHooks.open(TransitionDemoContent)
                    </button>
                    <button type="button" class="Btn" data-testid="close-top" @click="closeTop">
                        closeTop
                    </button>
                    <button type="button" class="Btn" data-testid="close-all" @click="closeAll">
                        closeAll
                    </button>
                </div>
            </div>

            <div class="Block">
                <h2 class="SubTitle">StackCard (display: stack+cache) — stackVisible=true behavior</h2>
                <p class="Help">
                    Push entries sequentially to grow the stack (latest-wins means naive rapid pushes will
                    collapse). Each card shows
                    <code>index/depth/isTop</code>
                    from EntryContext.
                </p>

                <div class="Buttons">
                    <button type="button" class="Btn" data-testid="stackcard-push-one" @click="pushOne">
                        stackCard.push('/cache-state')
                    </button>
                    <button
                        type="button"
                        class="Btn"
                        data-testid="stackcard-no-transition-push-one"
                        @click="pushOneNoTransition"
                    >
                        stackCardNoTransition.push('/cache-state')
                    </button>
                    <button
                        type="button"
                        class="Btn"
                        data-testid="stackcard-push-two"
                        @click="pushTwoSequential"
                    >
                        push 2 cards (sequential)
                    </button>
                    <button type="button" class="Btn" data-testid="stackcard-back" @click="goBack">
                        closeTop
                    </button>
                </div>
            </div>

            <div class="Block">
                <h2 class="SubTitle">Notes</h2>
                <ul class="List">
                    <li>
                        Presenter owns CSS/Z-order. Layerge does not set zIndex, transforms, or a11y trigger
                        attributes.
                    </li>
                    <li>
                        &lt;LayergeTransition&gt; injects EntryContext (no props) and guarantees notify
                        ordering.
                    </li>
                    <li>
                        In the hooks presenter, user hooks are attached to &lt;LayergeTransition&gt;. Internal
                        notify still runs (composition is tested by closing).
                    </li>
                </ul>
            </div>
        </div>
    </PageShell>
</template>

<script setup>
import {useRouter} from 'vue-router';
import {useLayerge} from 'layerge';
import PageShell from './_PageShell.vue';
import TransitionDemoContent from '../components/TransitionDemoContent.vue';
import StackCardDemoContent from '../components/StackCardDemoContent.vue';

const router = useRouter();
const layerge = useLayerge();

const openModal = () => {
    router.modal.open(TransitionDemoContent);
};

const openModalNoTransition = () => {
    // Non-animated presenter variant: no <LayergeTransition>
    router.modalNoTransition.open(TransitionDemoContent);
};

const openModalWithHooks = () => {
    // This presenter attaches user hooks on <LayergeTransition>.
    router.modalHooks.open(TransitionDemoContent);
};

const closeTop = () => {
    layerge.closeTop();
};

const closeAll = () => {
    layerge.closeAll();
};

const pushOne = () => {
    // Use Component target so the background route does not navigate.
    // This avoids a full remount of the background page when closing.
    router.stackCard.push(StackCardDemoContent);
};

const pushOneNoTransition = () => {
    // Non-animated stack presenter variant
    router.stackCardNoTransition.push(StackCardDemoContent);
};

const waitForDepth = (expected, timeoutMs) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();

        const tick = () => {
            if (layerge.depth === expected) {
                resolve(true);
                return;
            }

            if (Date.now() - start > timeoutMs) {
                reject(new Error(`timeout waiting for depth=${expected}`));
                return;
            }

            window.setTimeout(tick, 50);
        };

        tick();
    });
};

const pushTwoSequential = async () => {
    const baseDepth = layerge.depth;

    // NOTE: pushing the same RouteLocationRaw twice ("/cache-state") would be a duplicated navigation
    // and the 2nd commit would never happen. Use Component targets for this demo so it is deterministic.
    router.stackCard.push(StackCardDemoContent);
    await waitForDepth(baseDepth + 1, 2000);

    router.stackCard.push(StackCardDemoContent);
    await waitForDepth(baseDepth + 2, 2000);
};

const goBack = () => {
    // router.back() may navigate away from this page if we didn't change the URL.
    // For stack demos, use closeTop to validate leaving retention behavior.
    layerge.closeTop();
};
</script>

<style scoped>
.Root {
    display: grid;
    gap: 16px;
}

.Block {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 10px;
}

.SubTitle {
    margin: 0;
    font-size: 14px;
}

.Help {
    margin: 0;
    font-size: 12px;
    color: #444;
}

.Buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.Btn {
    padding: 8px 10px;
    cursor: pointer;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
}

.List {
    display: grid;
    gap: 6px;
    padding-left: 18px;
    margin: 0;
    font-size: 12px;
    color: #333;
}
</style>
