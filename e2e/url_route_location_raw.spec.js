import {expect, test} from '@playwright/test';

test('modal.push(Component, {url: RouteLocationRaw}) updates URL (query/hash) and shows overlay', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-url-query-hash').click();

    await expect(page).toHaveURL(/\/\?u=1#h$/);
    await expect(page.getByTestId('fakepath-content')).toBeVisible();
    await expect(page.getByTestId('current-url')).toHaveText('/?u=1#h');

    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('fakepath-content')).toHaveCount(0);
});
