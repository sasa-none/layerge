import {test, expect} from '@playwright/test';

test('deep link /modal/cache-demo opens stackCard and cache-state keeps state when returning', async ({page}) => {
    await page.goto('/modal/cache-demo');

    const dialog = page.getByRole('dialog').last();
    const cache = dialog.getByTestId('cache-root');

    await expect(cache).toBeVisible();

    await cache.getByTestId('cache-inc').click();
    await cache.getByTestId('cache-input').fill('hello');

    await expect(cache.getByTestId('cache-counter')).toHaveText('1');
    await expect(cache.getByTestId('cache-text')).toHaveText('hello');
});
