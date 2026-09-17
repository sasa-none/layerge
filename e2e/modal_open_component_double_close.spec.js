import {expect, test} from '@playwright/test';

test('modal.open(Component): closing twice is safe (idempotent)', async ({page}) => {
    const errors = [];

    page.on('pageerror', (e) => {
        errors.push(e);
    });
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            errors.push(new Error(msg.text()));
        }
    });

    await page.goto('/');
    await expect(page.getByTestId('home-url')).toHaveText('/');

    await page.getByTestId('modal-open-component').click();
    await expect(page.getByTestId('modal-openonly-title')).toBeVisible();

    // Close twice using an in-presenter helper to avoid flake from viewport/overlay timing.
    await page.getByTestId('openonly-close-twice').click();

    await expect(page.getByTestId('modal-openonly-title')).toHaveCount(0);
    expect(errors, `unexpected errors: ${errors.map((e) => String(e)).join('\n')}`).toHaveLength(0);
});
