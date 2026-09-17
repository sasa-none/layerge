import {expect, test} from '@playwright/test';

test('modal.push(Component, {fakePath}) restores presenter on forward', async ({page}) => {
    await page.goto('/');

    await expect(page.getByTestId('home-url')).toHaveText('/');

    // push presenter (URL will move to /fake/help)
    await page.getByTestId('modal-fakepath').click();

    await expect(page).toHaveURL(/\/fake\/help$/);
    await expect(page.getByTestId('fakepath-content')).toBeVisible();
    await expect(page.getByTestId('overlay-presenter')).toBeVisible();

    const entryIdBefore = await page.getByTestId('entry-id').textContent();

    // Back closes presenter (goes back to /)
    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-url')).toHaveText('/');
    await expect(page.getByTestId('fakepath-content')).toHaveCount(0);

    // Forward should restore the presenter (presenter mode, not page mode)
    await page.goForward();

    await expect(page).toHaveURL(/\/fake\/help$/);
    await expect(page.getByTestId('fakepath-content')).toBeVisible();
    await expect(page.getByTestId('overlay-presenter')).toBeVisible();

    const entryIdAfter = await page.getByTestId('entry-id').textContent();

    // entryId should be identical (restore same entry)
    expect(entryIdAfter).toBe(entryIdBefore);
});
