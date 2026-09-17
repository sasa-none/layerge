import {expect, test} from '@playwright/test';

test('modal.push(failingLoader, {url}) shows error UI and back returns', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-url-loader-fail').click();

    await expect(page).toHaveURL(/\/fake\/help-fail$/);

    // While pending, show the loading UI.
    await expect(page.getByTestId('presenter-loading')).toBeVisible();

    // If the loader rejects, show the error UI instead of crashing.
    await expect(page.getByTestId('presenter-error')).toBeVisible();
    await expect(page.getByTestId('presenter-error')).toContainText('Failed to render content');
    await expect(page.getByTestId('presenter-error')).toContainText('Intentional loader failure for demo.');

    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('presenter-error')).toHaveCount(0);
});