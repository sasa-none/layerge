import {expect, test} from '@playwright/test';

test('pending=true waits commit() before closing (no confirm)', async ({page}) => {
    await page.goto('/advanced');

    await expect(page.getByTestId('advanced-state')).toContainText('state:');

    await page.getByTestId('advanced-open').click();
    await expect(page.getByTestId('advanced-leave-guard-content')).toBeVisible();

    // Ensure confirm is not triggered during the test.
    await page.getByTestId('advanced-dirty').uncheck();
    await page.getByTestId('advanced-use-confirm').uncheck();

    await page.getByTestId('advanced-pending').check();
    await page.getByTestId('advanced-commit-delay').fill('600');

    await page.getByTestId('advanced-close-self').click();

    // Should still be visible while commit is in progress.
    await page.waitForTimeout(200);
    await expect(page.getByTestId('advanced-leave-guard-content')).toBeVisible();

    // After commit delay, it should close.
    await page.waitForTimeout(700);
    await expect(page.getByTestId('advanced-leave-guard-content')).toBeHidden();
});
