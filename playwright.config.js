import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 10,
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]], // ← add this line
  use: {
    baseURL: "https://marsos-nextv2.vercel.app/",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
