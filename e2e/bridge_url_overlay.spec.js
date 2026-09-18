import {expect, test} from '@playwright/test';

test('bridge route /modal/url-overlay opens a url modal and back returns to the previous in-app page', async ({page}) => {
    await page.goto('/');

    // Navigate via in-app link (RouterLink).
    await page.getByTestId('route-bridge-url-overlay').click();

    // The bridge route should immediately navigate to the url.
    await expect(page).toHaveURL(/\/no-route\/help$/);

    // The bridge replaces itself with a real page, so the background is Home (not the scaffold).
    await expect(page.getByRole('heading', {name: 'Layerge Demo'})).toBeVisible();

    // Overlay should show UrlOverlayContent.
    await expect(page.getByText('OverlayPresenter')).toBeVisible();
    await expect(page.getByTestId('url-overlay-content')).toBeVisible();
    await expect(page.getByTestId('current-url')).toHaveText('/no-route/help');

    // Back should return to Home (the previous in-app page), not to the bridge route.
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', {name: 'Layerge Demo'})).toBeVisible();
});

test('bridge route /modal/url-overlay lands on a real page after closing (direct load)', async ({page}) => {
    // deep link を共有された人と同じ入り方（フルリロード）
    await page.goto('/modal/url-overlay');

    await expect(page).toHaveURL(/\/no-route\/help$/);
    await expect(page.getByTestId('url-overlay-content')).toBeVisible();

    await page.getByTestId('overlay-close').click();

    // 足場である bridge route ではなく、アプリの実ページ（Home）に着地する
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', {name: 'Layerge Demo'})).toBeVisible();
    await expect(page.getByTestId('home-depth')).toHaveText('0');
});
