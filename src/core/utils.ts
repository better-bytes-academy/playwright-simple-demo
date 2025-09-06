import { expect, Locator } from "@playwright/test";

export const wait = (second: number) => new Promise(resolve => setTimeout(resolve, second * 1000));

export const waitVisibleWithTryCatch = async (locator: Locator, timeout = 5000) => {
    try {
        await expect(locator).toBeVisible({ timeout: timeout })
    } catch (e) {
        console.log('Got exception when trying to wait visible: ', e);
    }
}

export const clickWithTryCatch = async (locator: Locator, timeout = 5000) => {
    try {
        await locator.click();
    } catch (e) {
        console.log('Got exception when trying to wait visible: ', e);
    }
}