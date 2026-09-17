import {expect, test} from '@playwright/test';

test('modal.replace(Component, {fakePath}) overlay-close restores returnTo (home)', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-replace-component').click();

    await expect(page).toHaveURL(/\/fake\/replace$/);
    await expect(page.getByTestId('modal-open-content-title')).toBeVisible();

    await page.getByTestId('overlay-close').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-url')).toHaveText('/');
});
