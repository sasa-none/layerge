import {expect, test} from '@playwright/test';

test('closeTop({restoreUrl:false}) keeps URL while restoring underlying presenter (open → push → replace)', async ({page}) => {
    await page.goto('/');

    await page.getByTestId('modal-open-mixed').click();
    await expect(page.getByTestId('mixed-open-title')).toBeVisible();

    await page.getByTestId('mixed-open-to-push').click();
    await expect(page).toHaveURL(/\/mixed\/push$/);
    await expect(page.getByTestId('mixed-push-title')).toBeVisible();

    await page.getByTestId('mixed-push-to-replace').click();
    await expect(page).toHaveURL(/\/mixed\/replace$/);
    await expect(page.getByTestId('mixed-replace-title')).toBeVisible();

    // Close the replace presenter without restoring URL.
    await page.getByTestId('mixed-replace-close-norestore').click();

    // URL should remain at the url, but the underlying presenter should be revealed.
    await expect(page).toHaveURL(/\/mixed\/replace$/);
    await expect(page.getByTestId('mixed-replace-title')).toHaveCount(0);
    await expect(page.getByTestId('mixed-push-title')).toBeVisible();
});
