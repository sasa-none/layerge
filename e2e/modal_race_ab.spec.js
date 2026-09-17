import {expect, test} from '@playwright/test';

test('race A(delay) -> B ends with B in presenter mode and stays there', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-race-ab').click();

    await expect(page).toHaveURL(/\/page-b$/);

    // B should be shown inside the overlay presenter.
    await expect(page.getByText('OverlayPresenter')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Page B'})).toBeVisible();

    // The final navigation should be recorded.
    await expect(page.getByTestId('last-result')).toContainText('resolved: /page-b');

    // Wait longer than the delayed navigation (1200ms) and ensure presenter mode is not exited.
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/page-b$/);
    await expect(page.getByText('OverlayPresenter')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Page B'})).toBeVisible();
});
