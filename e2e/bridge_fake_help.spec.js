import {expect, test} from '@playwright/test';

test('bridge route /modal/fake-help opens a url modal and back returns to the previous in-app page', async ({page}) => {
    await page.goto('/');

    // Navigate via in-app link (RouterLink).
    await page.getByTestId('route-bridge-fake-help').click();

    // The bridge route should immediately navigate to the url.
    await expect(page).toHaveURL(/\/fake\/help$/);

    // The background is frozen to the entry route (so the modal feels like an overlay).
    await expect(page.getByRole('heading', {name: 'Bridge route: /modal/fake-help'})).toBeVisible();

    // Overlay should show UrlOverlayContent.
    await expect(page.getByText('OverlayPresenter')).toBeVisible();
    await expect(page.getByTestId('url-overlay-content')).toBeVisible();
    await expect(page.getByTestId('current-url')).toHaveText('/fake/help');

    // Back should return to Home (the previous in-app page), not to the bridge route.
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', {name: 'Layerge Demo'})).toBeVisible();
});
