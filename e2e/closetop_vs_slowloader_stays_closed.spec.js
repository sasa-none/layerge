import {expect, test} from '@playwright/test';

test('closeTop vs slow loader: stays closed and does not resurrect later', async ({page}) => {
    await page.goto('/');

    await page.getByTestId('closetop-vs-slowloader').click();
    await expect(page.getByTestId('last-action')).toHaveText('closeTop vs slow loader');

    // It should settle back to page mode.
    await expect(page.getByTestId('home-mode')).toHaveText('page', {timeout: 5000});
    await expect(page).toHaveURL(/\/$/);

    // Wait until the loader would have resolved.
    await page.waitForTimeout(1400);

    await expect(page.getByTestId('home-mode')).toHaveText('page');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
});
