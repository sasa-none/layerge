import {expect, test} from '@playwright/test';

test('modal.push(Component, {url: current fullPath}) is no-op (router-link behavior)', async ({page}) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-url-noop').click();

    // no-op: URL unchanged, overlay not opened
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('url-overlay-content')).toHaveCount(0);
});
