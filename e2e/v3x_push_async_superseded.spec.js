import {expect, test} from '@playwright/test';

test('pushAsync(slow) then pushAsync(fast) resolves slow as superseded', async ({page}) => {
    await page.goto('/advanced');

    // Start slow (delayed navigate), then immediately start fast.
    await page.getByTestId('advanced-push-async-slow').click();
    await page.waitForTimeout(50);
    await page.getByTestId('advanced-push-async-fast').click();

    const log = page.getByTestId('advanced-async-log');
    await expect(log).toContainText('pushAsync(slow): start');

    // Slow should settle as superseded, fast should complete.
    await expect(log).toContainText('pushAsync(slow): superseded');
    await expect(log).toContainText('pushAsync(fast): completed');
});
