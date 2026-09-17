import {expect, test} from '@playwright/test';

test('modal.open(RouteLocationRaw) can render another route in view-only mode (URL unchanged)', async ({page}) => {
    await page.goto('/');

    await page.getByTestId('modal-open-mismatch').click();

    // open() is view-only: URL stays on home.
    await expect(page.getByTestId('home-url')).toHaveText('/');
    await expect(page.getByTestId('home-mode')).toHaveText('presenter');
    await expect(page.getByTestId('home-depth')).toHaveText('1');

    // But the overlay can render another route (Page A).
    await expect(page.getByRole('heading', {name: 'Page A'})).toBeVisible();

    // Close and ensure we are back to page mode.
    await page.getByTestId('overlay-close').click();
    await expect(page.getByTestId('home-mode')).toHaveText('page');
    await expect(page.getByTestId('home-depth')).toHaveText('0');
});
