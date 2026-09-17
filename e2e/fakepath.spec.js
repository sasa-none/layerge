import {expect, test} from '@playwright/test';

test('modal.push(Component, {fakePath}) updates URL, shows overlay, and back returns', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-fakepath').click();

    await expect(page).toHaveURL(/\/fake\/help$/);
    await expect(page.getByTestId('fakepath-content')).toBeVisible();
    await expect(page.getByTestId('current-url')).toHaveText('/fake/help');

    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('fakepath-content')).toHaveCount(0);
});
