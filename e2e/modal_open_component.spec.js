import {expect, test} from '@playwright/test';

test('modal.open(Component) opens overlay without navigation, and close returns to page', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-open-component').click();

    // open() does not navigate.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-mode')).toHaveText('presenter');
    await expect(page.getByTestId('home-depth')).toHaveText('1');
    await expect(page.getByTestId('modal-openonly-title')).toBeVisible();

    // Close the overlay using the presenter's close button.
    await page.getByTestId('overlay-close').click();

    await expect(page.getByTestId('home-mode')).toHaveText('page');
    await expect(page.getByTestId('home-depth')).toHaveText('0');
    await expect(page.getByTestId('modal-openonly-title')).toHaveCount(0);
});
