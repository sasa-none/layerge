import {expect, test} from '@playwright/test';

test.describe('v3.x closeAsync demo', () => {
    test('closeAsync(lastEntryId) completes when dirty=false', async ({page}) => {
        await page.goto('/v3-advanced');

        await page.getByTestId('v3-open').click();
        await expect(page.getByTestId('v3-leave-guard-content')).toBeVisible();

        // Ensure close can proceed without confirmation.
        await page.getByTestId('v3-dirty').uncheck();

        // Wait until lastEntryId is captured by nextTick.
        await expect(page.getByTestId('v3-state')).toContainText('lastEntryId=');
        await expect(page.getByTestId('v3-state')).not.toContainText('lastEntryId=-');

        await page.getByTestId('v3-close-async-self').click();

        // Presenter should close.
        await expect(page.getByTestId('v3-leave-guard-content')).toHaveCount(0);
        await expect(page.getByTestId('v3-async-log')).toContainText('closeAsync: completed');
    });

    test('closeAsync(lastEntryId) aborts when user cancels confirm', async ({page}) => {
        await page.goto('/v3-advanced');

        await page.getByTestId('v3-open').click();
        await expect(page.getByTestId('v3-leave-guard-content')).toBeVisible();

        // Default is dirty=true, and confirm uses window.confirm.
        page.on('dialog', async (dialog) => {
            await dialog.dismiss();
        });

        await expect(page.getByTestId('v3-state')).not.toContainText('lastEntryId=-');

        await page.getByTestId('v3-close-async-self').click();

        // Presenter should remain open.
        await expect(page.getByTestId('v3-leave-guard-content')).toBeVisible();
        await expect(page.getByTestId('v3-async-log')).toContainText('closeAsync: aborted');
    });
});
