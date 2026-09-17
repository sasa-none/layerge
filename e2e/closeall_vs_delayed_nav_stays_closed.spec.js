import {expect, test} from '@playwright/test';

test('closeAll vs delayed nav: stays closed and does not navigate later', async ({page}) => {
    await page.goto('/');

    await page.getByTestId('closeall-vs-delayed').click();
    await expect(page.getByTestId('last-action')).toHaveText('closeAll vs delayed nav');

    // It should settle back to page mode quickly.
    await expect(page.getByTestId('home-mode')).toHaveText('page', {timeout: 5000});
    await expect(page).toHaveURL(/\/$/);

    // Wait until the delayed guard would have resolved.
    await page.waitForTimeout(1400);

    // Ensure nothing "wins later".
    await expect(page.getByTestId('home-mode')).toHaveText('page');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
});
