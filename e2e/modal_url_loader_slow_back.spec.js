import {expect, test} from '@playwright/test';

test('slow url loader can be cancelled by browser back (should not resurrect later)', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-url-loader-slow').click();

    await expect(page).toHaveURL(/\/fake\/help-slow$/);

    // Immediately go back.
    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', {name: 'Layerge Demo'})).toBeVisible();

    // Wait longer than the slow loader (1200ms).
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/$/);

    // Ensure the async component did not show up after cancellation.
    await expect(page.getByTestId('url-overlay-content')).toHaveCount(0);
});
