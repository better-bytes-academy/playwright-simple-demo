import test, { expect } from "@playwright/test";

test.describe("Demo reporting", () => {
    test('should pass successfully', {
        tag: '@TC001'
    }, async ({ page }) => {
        await page.goto('https://playwright.dev/');
        await expect(page).toHaveTitle(/Playwright/);
    });

    test('should demonstrate a failure', {
        tag: '@TC002'
    }, async ({ page }) => {
        await page.goto('https://playwright.dev/');
        await expect(page).toHaveTitle('This will fail');
    });

    test.skip('should be skipped', {
        tag: '@TC003'
    }, async ({ page }) => {
        await page.goto('https://playwright.dev/');
    });

    test('should pass after retry', {
        tag: '@TC004'
    }, async ({ page }) => {
        const randomNum = Math.random();
        if (randomNum < 0.5) {
            throw new Error('Random failure for retry demonstration');
        }
        await page.goto('https://playwright.dev/');
        await expect(page).toHaveTitle(/Playwright/);
    });
});