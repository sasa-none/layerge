import {expect, test} from '@playwright/test';

test('pending=true waits commit() before closing (no confirm)', async ({page}) => {
    await page.goto('/v3-advanced');

    await expect(page.getByTestId('v3-state')).toContainText('state:');

    await page.getByTestId('v3-open').click();
    await expect(page.getByTestId('v3-leave-guard-content')).toBeVisible();

    // Ensure confirm is not triggered during the test.
    await page.getByTestId('v3-dirty').uncheck();
    await page.getByTestId('v3-use-confirm').uncheck();

    await page.getByTestId('v3-pending').check();
    await page.getByTestId('v3-commit-delay').fill('600');

    await page.getByTestId('v3-close-self').click();

    // Should still be visible while commit is in progress.
    await page.waitForTimeout(200);
    await expect(page.getByTestId('v3-leave-guard-content')).toBeVisible();

    // After commit delay, it should close.
    await page.waitForTimeout(700);
    await expect(page.getByTestId('v3-leave-guard-content')).toBeHidden();
});
