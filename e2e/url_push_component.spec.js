import {expect, test} from '@playwright/test';

test('modal.push(Component, {url}) updates URL, shows overlay, and back returns', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-url').click();

    await expect(page).toHaveURL(/\/no-route\/help$/);
    await expect(page.getByTestId('url-overlay-content')).toBeVisible();
    await expect(page.getByTestId('current-url')).toHaveText('/no-route/help');

    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('url-overlay-content')).toHaveCount(0);
});
