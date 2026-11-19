import {expect, test} from '@playwright/test';

/**
 * readBeforeCloseCalls - デモの controlledHooks.beforeClose が呼ばれた回数を読みます
 * @param page - Playwright の Page
 * @returns 呼び出し回数
 */
const readBeforeCloseCalls = (page) => {
    return page.evaluate(() => {
        // @ts-ignore
        return window.__layergeDemoBeforeCloseCalls;
    });
};

/**
 * enableAsyncClose - beforeClose を Promise で返すモードに切り替えます
 * @param page - Playwright の Page
 * @param cancelClose - true の場合は close を中止させる
 * @returns 切り替え完了
 */
const enableAsyncClose = (page, cancelClose) => {
    return page.evaluate((cancel) => {
        // @ts-ignore
        window.__layergeDemoFlags.asyncClose = true;
        // @ts-ignore
        window.__layergeDemoFlags.cancelClose = cancel;
    }, cancelClose);
};

// leave guard を持たない Presenter では、同期パスで開始した async beforeClose を
// async パスで呼び直していたため、1 回の close で確認 UI が 2 回出ていた（Issue #1 の調査で発見）
test.describe('async controlledHooks.beforeClose is called once per close', () => {
    test('allowing the close closes the overlay after one call', async ({page}) => {
        await page.goto('/');
        await enableAsyncClose(page, false);

        await page.getByTestId('modal-open-component').click();
        await expect(page.getByTestId('modal-openonly-title')).toBeVisible();

        await page.getByTestId('overlay-close').click();

        await expect(page.getByTestId('home-mode')).toHaveText('page');
        await expect(page.getByTestId('modal-openonly-title')).toHaveCount(0);
        expect(await readBeforeCloseCalls(page)).toBe(1);
    });

    test('cancelling the close keeps the overlay after one call', async ({page}) => {
        await page.goto('/');
        await enableAsyncClose(page, true);

        await page.getByTestId('modal-open-component').click();
        await expect(page.getByTestId('modal-openonly-title')).toBeVisible();

        await page.getByTestId('overlay-close').click();

        // async の hook が確定するまで待ってから、閉じていないことを確かめる
        await expect.poll(() => readBeforeCloseCalls(page)).toBe(1);
        await page.waitForTimeout(200);

        await expect(page.getByTestId('home-mode')).toHaveText('presenter');
        await expect(page.getByTestId('modal-openonly-title')).toBeVisible();
        expect(await readBeforeCloseCalls(page)).toBe(1);
    });
});
