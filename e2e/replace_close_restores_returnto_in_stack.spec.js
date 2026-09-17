import {expect, test} from '@playwright/test';

test('replace overlay-close restores returnTo even when stacked (open → push → replace)', async ({page}) => {
    await page.goto('/');

    await page.getByTestId('modal-open-mixed').click();
    await expect(page.getByTestId('mixed-open-title')).toBeVisible();

    await page.getByTestId('mixed-open-to-push').click();
    await expect(page).toHaveURL(/\/mixed\/push$/);
    await expect(page.getByTestId('mixed-push-title')).toBeVisible();

    await page.getByTestId('mixed-push-to-replace').click();
    await expect(page).toHaveURL(/\/mixed\/replace$/);
    await expect(page.getByTestId('mixed-replace-title')).toBeVisible();

    // closeTop should restore URL to the route that was visible when replace() happened.
    await page.getByTestId('mixed-replace-close').click();

    await expect(page).toHaveURL(/\/mixed\/push$/);
    await expect(page.getByTestId('mixed-push-title')).toBeVisible();
});