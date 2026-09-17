import {expect, test} from '@playwright/test';

test('modal.push(Component, {url}) overlay-close behaves like back', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-url').click();

    await expect(page).toHaveURL(/\/fake\/help$/);
    await expect(page.getByTestId('url-overlay-content')).toBeVisible();
    await expect(page.getByTestId('current-url')).toHaveText('/fake/help');

    // Close the overlay using the presenter's close button.
    await page.getByTestId('overlay-close').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-url')).toHaveText('/');
    await expect(page.getByTestId('url-overlay-content')).toHaveCount(0);
});
