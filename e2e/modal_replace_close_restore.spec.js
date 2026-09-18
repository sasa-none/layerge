import {expect, test} from '@playwright/test';

test('replace-close restores URL to from.fullPath', async ({page}) => {
    await page.goto('/');

    // Create a route entry so we can observe from.fullPath restoration.
    await page.getByTestId('nav-to-page-a').click();
    await expect(page).toHaveURL(/\/page-a$/);
    await expect(page.getByRole('heading', {name: 'Page A'})).toBeVisible();

    // Replace current entry with url + component overlay.
    await page.getByTestId('modal-replace-url').click();
    await expect(page).toHaveURL(/\/no-route\/replace$/);
    await expect(page.getByTestId('modal-open-content-title')).toBeVisible();

    // Close via overlay (×). URL should restore to from.fullPath (/page-a).
    await page.getByTestId('overlay-close').click();
    await expect(page).toHaveURL(/\/page-a$/);
    await expect(page.getByRole('heading', {name: 'Page A'})).toBeVisible();
});
