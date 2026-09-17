import {expect, test} from '@playwright/test';

const closeOverlayIfOpen = async (page) => {
    const closeBtn = page.getByTestId('overlay-close');
    if (await closeBtn.count()) {
        await closeBtn.click();
        await page.waitForTimeout(350);
    }
};

test('v2: LayergeLink push opens presenter', async ({page}) => {
    await page.goto('/v2-link');

    await expect(page.getByTestId('v2-link-demo-page')).toBeVisible();

    await page.getByTestId('v2-layerge-link-push').click();
    await expect(page.getByTestId('overlay-presenter')).toBeVisible();

    // content should be Page B (DemoPage title)
    await expect(page.locator('[data-testid="overlay-presenter"]')).toContainText('Page B');

    await closeOverlayIfOpen(page);
    await expect(page.getByTestId('overlay-presenter')).toHaveCount(0);
});

test('v2: LayergeLink custom slot provides navigate/handler', async ({page}) => {
    await page.goto('/v2-link');

    await page.getByTestId('v2-custom-navigate').click();
    await expect(page.getByTestId('overlay-presenter')).toBeVisible();
    await expect(page.locator('[data-testid="overlay-presenter"]')).toContainText('Page B');

    await closeOverlayIfOpen(page);

    await page.getByTestId('v2-custom-handler-replace').click();
    await expect(page.getByTestId('overlay-presenter')).toBeVisible();
    await expect(page.locator('[data-testid="overlay-presenter"]')).toContainText('Page B');

    await closeOverlayIfOpen(page);
});

test('v2: LayergeLink disabled does nothing', async ({page}) => {
    await page.goto('/v2-link');

    await page.getByTestId('v2-layerge-link-disabled').click();
    await page.waitForTimeout(50);

    await expect(page.getByTestId('overlay-presenter')).toHaveCount(0);
    await expect(page).toHaveURL(/\/v2-link/);
});

test('v2: LayergeLink route mode supports url (query/hash) on push', async ({page}) => {
    await page.goto('/v2-link');

    await page.getByTestId('v2-layerge-link-url').click();

    await expect(page.getByTestId('overlay-presenter')).toBeVisible();
    await expect(page.getByTestId('v2-url')).toContainText('?u=1#h');

    await closeOverlayIfOpen(page);
});

test('v2: LayergeLink component mode can open without navigation', async ({page}) => {
    await page.goto('/v2-link');
    const before = await page.getByTestId('v2-url').textContent();

    await page.getByTestId('v2-layerge-link-open-component').click();
    await expect(page.getByTestId('overlay-presenter')).toBeVisible();
    await expect(page.getByTestId('inline-overlay')).toBeVisible();
    await expect(page.getByTestId('v2-url')).toHaveText(before || '');

    await closeOverlayIfOpen(page);
});

test('v2: prevent=false bypasses Layerge on ctrl/meta click', async ({page}) => {
    await page.goto('/v2-link');

    const link = page.getByTestId('v2-layerge-link-prevent-false');

    // In many browsers this opens a new tab and does not affect the current page.
    // We only assert that Layerge does NOT open the presenter in the current page.
    await link.click({modifiers: ['Control']});
    await page.waitForTimeout(100);

    await expect(page.getByTestId('overlay-presenter')).toHaveCount(0);
    await expect(page).toHaveURL(/\/v2-link/);
});

test('v2: useLayergeLink keydown (Enter) opens presenter and notifies hooks', async ({page}) => {
    await page.goto('/v2-link');

    await page.getByTestId('v2-hooks-clear').click();

    // Focus the button and trigger via keyboard
    const btn = page.getByTestId('v2-hooks-open');
    await btn.focus();
    await page.keyboard.press('Enter');

    const log = page.getByTestId('v2-hooks-log');

    await expect(log).toContainText('A:beforeOpen');
    await expect(log).toContainText('A:opened');
    await expect(log).toContainText('A:entered');

    await expect(page.getByTestId('overlay-presenter')).toBeVisible();
    await closeOverlayIfOpen(page);
});

test('v2: useLayergeLink hooks (opened/entered/closed/settled) are notified', async ({page}) => {
    await page.goto('/v2-link');

    await page.getByTestId('v2-hooks-clear').click();
    await page.getByTestId('v2-hooks-open').click();

    const log = page.getByTestId('v2-hooks-log');

    await expect(log).toContainText('A:beforeOpen');
    await expect(log).toContainText('A:opened');
    await expect(log).toContainText('A:entered');

    // close via presenter
    await expect(page.getByTestId('overlay-presenter')).toBeVisible();
    await page.getByTestId('overlay-close').click();

    // close transitions
    await page.waitForTimeout(350);

    await expect(log).toContainText('A:beforeClose');
    await expect(log).toContainText('A:closed');
    await expect(log).toContainText('A:settled:ok:close');
});

test('v2: useLayergeLink hooks carry a consistent entryId across open/close', async ({page}) => {
    await page.goto('/v2-link');

    await page.getByTestId('v2-hooks-clear').click();
    await page.getByTestId('v2-hooks-open').click();

    // Wait until opened line is written
    const log = page.getByTestId('v2-hooks-log');
    await expect(log).toContainText('A:opened:');

    const lines1 = await page.locator('[data-testid="v2-hooks-log"] .LogLine').allTextContents();
    const openedLine = lines1.find((x) => x.startsWith('A:opened:')) ?? '';
    const openedId = openedLine.replace('A:opened:', '');
    expect(openedId).not.toBe('');
    expect(openedId).not.toBe('null');

    // Close via presenter
    await closeOverlayIfOpen(page);
    await page.waitForTimeout(400);

    // Ensure closed hook has the same entryId
    const lines2 = await page.locator('[data-testid="v2-hooks-log"] .LogLine').allTextContents();
    const closedLine = lines2.find((x) => x.startsWith('A:closed:')) ?? '';
    const closedId = closedLine.replace('A:closed:', '');
    expect(closedId).toBe(openedId);
});

test('v2: invoker is disposed when entry leaves completely', async ({page}) => {
    await page.goto('/v2-link');

    await page.getByTestId('v2-hooks-clear').click();
    await page.getByTestId('v2-hooks-open').click();

    const log = page.getByTestId('v2-hooks-log');
    await expect(log).toContainText('A:opened');

    const lines = await page.locator('[data-testid="v2-hooks-log"] .LogLine').allTextContents();
    const openedLine = lines.find((x) => x.startsWith('A:opened:')) ?? '';
    const entryId = openedLine.replace('A:opened:', '');
    expect(entryId).not.toBe('');

    // Close presenter
    await closeOverlayIfOpen(page);

    // invoker should be disposed after leave completes
    await page.waitForTimeout(400);

    const invoker = await page.evaluate((id) => {
        // @ts-ignore
        const lg = window.__layerge;
        if (!lg || typeof lg._getInvoker !== 'function') {
            return 'no-store';
        }
        return lg._getInvoker(id);
    }, entryId);

    expect(invoker).toBeFalsy();
});

test('v2: useLayergeLink openFailed is notified and settled always fires', async ({page}) => {
    await page.goto('/v2-link');

    await page.getByTestId('v2-hooks-clear').click();
    await page.getByTestId('v2-hooks-open-cancel').click();

    const log = page.getByTestId('v2-hooks-log');

    await expect(log).toContainText('CANCEL:beforeOpen');
    await expect(log).toContainText('CANCEL:openFailed');
    await expect(log).toContainText('CANCEL:settled:ng:open');
});
