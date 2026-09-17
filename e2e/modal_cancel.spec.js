import {expect, test} from '@playwright/test';

test('modal push cancelled by guard shows aborted result and no presenter', async ({page}) => {
    await page.goto('/');

    await page.getByTestId('modal-cancel').click();

    await expect(page).toHaveURL(/\/$/);

    // No overlay should be opened.
    await expect(page.getByText('OverlayPresenter')).toHaveCount(0);

    await expect(page.getByTestId('last-result')).toContainText('aborted (guard returned false)');
});

test('delayed cancel shows aborted result and no presenter', async ({page}) => {
    await page.goto('/');

    await page.getByTestId('modal-cancel-delayed').click();

    await expect(page).toHaveURL(/\/$/);

    await expect(page.getByText('OverlayPresenter')).toHaveCount(0);

    // Wait for delayed abort.
    await expect(page.getByTestId('last-result')).toContainText('aborted (guard returned false)', {timeout: 5000});
});
