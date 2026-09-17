import {expect, test} from '@playwright/test';

// v1.x (headless + EntryContext + leaving retention + LayergeTransition)
// These tests validate the new invariant behaviors introduced in v1.x.

test('transition demo: modal open -> phase becomes active -> close keeps leaving briefly then disappears', async ({page}) => {
    await page.goto('/transition');

    await expect(page.getByTestId('transition-demo-page')).toBeVisible();

    // Open the modal (display: top)
    await page.getByTestId('open-modal-transition').click();
    await expect(page.getByTestId('overlay-presenter')).toBeVisible();

    // Enter notification should switch phase to active (LayergeTransition after-enter/appear)
    await expect(
        page.locator('[data-testid="overlay-presenter"] .Meta [data-testid="entry-phase"]')
    ).toHaveText('active');

    // Close from within the overlay (more robust than clicking behind the overlay)
    await page.getByTestId('overlay-close').click();

    // Leaving should still be rendered for a short time (DOM retention)
    await page.waitForTimeout(50);
    await expect(page.getByTestId('overlay-presenter')).toHaveCount(1);

    // NOTE:
    // During a leave transition, Vue keeps the leaving DOM nodes but does not
    // guarantee reactive updates inside them. We validate retention + removal
    // rather than asserting the phase text becomes "leave".

    // After the transition finishes, the overlay should be removed
    await page.waitForTimeout(350);
    await expect(page.getByTestId('overlay-presenter')).toHaveCount(0);
});

test('transition demo: presenter with user hooks still closes cleanly', async ({page}) => {
    await page.goto('/transition');

    await page.getByTestId('open-modal-hooks-transition').click();
    await expect(page.getByTestId('overlay-presenter-hooks')).toBeVisible();

    // User hook should run (after-enter)
    await expect(page.getByTestId('hook-log')).toContainText('after-enter');

    // Close (after-leave user hook should not prevent internal notify)
    await page.getByTestId('overlay-hooks-close').click();
    await page.waitForTimeout(350);
    await expect(page.getByTestId('overlay-presenter-hooks')).toHaveCount(0);
});

test('transition demo: stackVisible=true renders multiple stack entries', async ({page}) => {
    await page.goto('/transition');

    await page.getByTestId('stackcard-push-two').click();

    const cards = page.getByTestId('stackcard-presenter');
    await expect(cards).toHaveCount(2);

    const indices = await page
        .locator('[data-testid="stackcard-presenter"] [data-testid="entry-index"]')
        .allTextContents();

    // index should include 0 and 1 (order does not matter)
    expect(indices.join(' ')).toContain('0');
    expect(indices.join(' ')).toContain('1');

    const isTopValues = await page
        .locator('[data-testid="stackcard-presenter"] [data-testid="entry-istop"]')
        .allTextContents();
    expect(isTopValues.join(' ')).toContain('true');
});
