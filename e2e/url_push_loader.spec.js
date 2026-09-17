import {expect, test} from '@playwright/test';

test('modal.push(loader, {url}) updates URL, shows overlay after loader resolves, and back returns', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-url-loader').click();

    await expect(page).toHaveURL(/\/fake\/help-async$/);
    await expect(page.getByTestId('url-overlay-content')).toBeVisible();
    await expect(page.getByTestId('current-url')).toHaveText('/fake/help-async');

    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('url-overlay-content')).toHaveCount(0);
});
