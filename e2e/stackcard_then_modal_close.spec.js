import {expect, test} from '@playwright/test';

test('stackCard then modal: close closes top first, then underlying presenter', async ({page}) => {
    await page.goto('/');

    // Open StackCard via the bridge route (it replaces to /cache-state).
    await page.getByTestId('route-bridge-cache-demo').click();
    await expect(page).toHaveURL(/\/cache-state$/);

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('StackCardPresenter')).toBeVisible();
    await expect(dialog.getByRole('heading', {name: 'Cache State'})).toBeVisible();

    // Open modal on top (button exists in both page and dialog; click dialog one).
    await dialog.getByTestId('cache-open-modal').click();
    await expect(page.getByTestId('modal-open-content-title')).toBeVisible();

    // Close the modal (top). Use DOM-click to avoid viewport limitations.
    await page.getByTestId('overlay-close').evaluate((el) => el.click());
    await expect(page.getByTestId('modal-open-content-title')).toHaveCount(0);

    // Underlying StackCard presenter should still be present.
    await expect(dialog.getByText('StackCardPresenter')).toBeVisible();

    // Close the underlying StackCard presenter.
    await dialog.getByTestId('stackcard-close').evaluate((el) => el.click());
    await expect(dialog.getByText('StackCardPresenter')).toHaveCount(0);

    // Cache State remains as the page (URL stays /cache-state).
    await expect(page).toHaveURL(/\/cache-state$/);
    await expect(page.getByRole('heading', {name: 'Cache State'})).toBeVisible();
});
