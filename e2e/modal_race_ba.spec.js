import {expect, test} from '@playwright/test';

test('race B(delay) -> A ends with A in presenter mode and stays there', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-race-ba').click();

    await expect(page).toHaveURL(/\/page-a$/);

    // A should be shown inside the overlay presenter.
    await expect(page.getByText('OverlayPresenter')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Page A'})).toBeVisible();

    await expect(page.getByTestId('last-result')).toContainText('resolved: /page-a');

    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/page-a$/);
    await expect(page.getByText('OverlayPresenter')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Page A'})).toBeVisible();
});
