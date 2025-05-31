// tests/firebase-otp-10-load.spec.js
const { test, expect } = require("@playwright/test");

// List of your 10 test phone numbers
const phoneNumbers = [
  "+966500000001",
  "+966500000002",
  "+966500000003",
  "+966500000004",
  "+966500000005",
  "+966500000006",
  "+966500000007",
  "+966500000008",
  "+966500000009",
  "+966500000010",
];

test.describe.parallel("10-user Firebase OTP Load Test", () => {
  for (const phone of phoneNumbers) {
    test(`Register & order with ${phone}`, async ({ page }) => {
      // 1. Go directly to the login page, wait for page 'load' event
      await page.goto("https://marsos-nextv2.vercel.app/user-login", {
        waitUntil: "load",
        timeout: 60000,
      });

      // 2. Fill in phone (only the local part; country code is preset)
      await page.waitForSelector('input[type="tel"]', { timeout: 10000 });
      const localNumber = phone.replace(/^\+966/, "");
      await page.fill('input[type="tel"]', localNumber);

      // 2a. Accept terms so the Send OTP button enables
      await page.check('input[type="checkbox"]');

      // 3. Send OTP
      await page.click("text=Send OTP");

      // 4. Wait for exactly six visible OTP slots and fill them
      const slots = page.locator("input.w-10.h-10.text-center");
      await expect(slots).toHaveCount(6, { timeout: 10000 });
      const code = "123456".split("");
      for (let i = 0; i < code.length; i++) {
        await slots.nth(i).fill(code[i], { timeout: 5000 });
      }

      // 5. Verify OTP
      await page.click("text=Verify OTP");

      // 6. Confirm landing page
      await expect(page).toHaveURL(/dashboard|profile/);

      // —— now simulate a simple order ——
      await page.click("text=Products");
      await expect(page).toHaveURL(/products/);

      await page.click(".product-card >> nth=0");
      await page.click("text=Add to Cart");

      await page.click("text=Cart");
      await page.click("text=Checkout");

      await page.fill('input[name="firstName"]', "User");
      await page.fill('input[name="lastName"]', "Test");
      await page.fill('input[name="address"]', "123 Test St");

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/order-success/);
      await expect(page.locator("text=Order Confirmed")).toBeVisible();
    });
  }
});
