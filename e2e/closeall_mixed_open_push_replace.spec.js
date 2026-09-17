import {expect, test} from '@playwright/test';

test('closeAll works with mixed open/push/replace entries and restores background URL', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    // open (no navigation)
    await page.getByTestId('modal-open-mixed').click();
    await expect(page.getByTestId('mixed-open-title')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    // push (navigates)
    await page.getByTestId('mixed-open-to-push').click();
    await expect(page).toHaveURL(/\/mixed\/push$/);
    await expect(page.getByTestId('mixed-push-title')).toBeVisible();

    // replace (navigates)
    await page.getByTestId('mixed-push-to-replace').click();
    await expect(page).toHaveURL(/\/mixed\/replace$/);
    await expect(page.getByTestId('mixed-replace-title')).toBeVisible();

    // closeAll should drop presenter mode and restore the original page URL.
    await page.getByTestId('mixed-replace-closeall').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-url')).toHaveText('/');

    await expect(page.getByTestId('mixed-open-title')).toHaveCount(0);
    await expect(page.getByTestId('mixed-push-title')).toHaveCount(0);
    await expect(page.getByTestId('mixed-replace-title')).toHaveCount(0);
});