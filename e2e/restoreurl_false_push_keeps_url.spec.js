import {expect, test} from '@playwright/test';

test('closeTop({restoreUrl:false}) keeps URL when closing a push entry (open → push)', async ({page}) => {
    await page.goto('/');

    await page.getByTestId('modal-open-mixed').click();
    await expect(page.getByTestId('mixed-open-title')).toBeVisible();

    await page.getByTestId('mixed-open-to-push').click();
    await expect(page).toHaveURL(/\/mixed\/push$/);
    await expect(page.getByTestId('mixed-push-title')).toBeVisible();

    // Close the push presenter without restoring URL.
    await page.getByTestId('mixed-push-close-norestore').click();

    // URL stays, but open-root presenter is visible.
    await expect(page).toHaveURL(/\/mixed\/push$/);
    await expect(page.getByTestId('mixed-push-title')).toHaveCount(0);
    await expect(page.getByTestId('mixed-open-title')).toBeVisible();
});
