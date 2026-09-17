import {expect, test} from '@playwright/test';

test('modal.push(Component, {url: currentFullPath}) is no-op (router-link behavior)', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-url-noop').click();

    // URL should remain unchanged and overlay should not open.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('fakepath-content')).toHaveCount(0);
});
