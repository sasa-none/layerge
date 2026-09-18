import {expect, test} from '@playwright/test';

test.describe('v3.x closeAsync demo', () => {
    test('closeAsync(lastEntryId) completes when dirty=false', async ({page}) => {
        await page.goto('/advanced');

        await page.getByTestId('advanced-open').click();
        await expect(page.getByTestId('advanced-leave-guard-content')).toBeVisible();

        // Ensure close can proceed without confirmation.
        await page.getByTestId('advanced-dirty').uncheck();

        // Wait until lastEntryId is captured by nextTick.
        await expect(page.getByTestId('advanced-state')).toContainText('lastEntryId=');
        await expect(page.getByTestId('advanced-state')).not.toContainText('lastEntryId=-');

        await page.getByTestId('advanced-close-async-self').click();

        // Presenter should close.
        await expect(page.getByTestId('advanced-leave-guard-content')).toHaveCount(0);
        await expect(page.getByTestId('advanced-async-log')).toContainText('closeAsync: completed');
    });

    test('closeAsync(lastEntryId) completes right after push+url', async ({page}) => {
        await page.goto('/advanced');

        await page.getByTestId('advanced-push').click();

        // push+url は URL 遷移を伴うため、確定（settled）を待ってから lastEntryId が入る
        await expect(page.getByTestId('advanced-settled')).toHaveText('settled: completed');
        await expect(page.getByTestId('advanced-state')).not.toContainText('lastEntryId=-');

        // Ensure close can proceed without confirmation.
        await page.getByTestId('advanced-dirty').uncheck();

        // ページ側のボタンはオーバーレイに覆われるため、同じ closeAsyncLast を呼ぶ
        // オーバーレイ内のボタンを使う
        await page.getByTestId('advanced-close-async-self').click();

        await expect(page.getByTestId('advanced-leave-guard-content')).toHaveCount(0);
        await expect(page.getByTestId('advanced-async-log')).toContainText('closeAsync: completed');
    });

    test('closeAsync(lastEntryId) aborts when user cancels confirm', async ({page}) => {
        await page.goto('/advanced');

        await page.getByTestId('advanced-open').click();
        await expect(page.getByTestId('advanced-leave-guard-content')).toBeVisible();

        // Default is dirty=true, and confirm uses window.confirm.
        page.on('dialog', async (dialog) => {
            await dialog.dismiss();
        });

        await expect(page.getByTestId('advanced-state')).not.toContainText('lastEntryId=-');

        await page.getByTestId('advanced-close-async-self').click();

        // Presenter should remain open.
        await expect(page.getByTestId('advanced-leave-guard-content')).toBeVisible();
        await expect(page.getByTestId('advanced-async-log')).toContainText('closeAsync: aborted');
    });
});
