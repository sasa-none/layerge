import {expect, test} from '@playwright/test';

test('A(delay) then B keeps B in presenter mode and logs superseded result', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-cancelled-by-newer').click();

    await expect(page).toHaveURL(/\/page-b$/);

    // B should be shown inside the overlay presenter.
    await expect(page.getByText('OverlayPresenter')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Page B'})).toBeVisible();

    // Wait longer than the delayed navigation (1200ms) and ensure presenter mode is not exited.
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/page-b$/);
    await expect(page.getByText('OverlayPresenter')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Page B'})).toBeVisible();

    // The delayed A should be labelled as superseded in the demo UI.
    await expect(page.getByTestId('last-result')).toContainText('cancelled (superseded by a newer navigation)');
});
