import {expect, test} from '@playwright/test';

test('modal.replace(Component, {url}) updates URL and back returns to previous page', async ({page}) => {
    await page.goto('/');

    // Create an in-app history entry first.
    await page.getByTestId('nav-to-page-a').click();
    await expect(page).toHaveURL(/\/page-a$/);
    await expect(page.getByRole('heading', {name: 'Page A'})).toBeVisible();

    // Replace current entry with url + component overlay.
    await page.getByTestId('modal-replace-url').click();

    await expect(page).toHaveURL(/\/no-route\/replace$/);
    await expect(page.getByTestId('modal-open-content-title')).toBeVisible();

    // Back should return to '/' because replace() replaced the /page-a entry.
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
});
