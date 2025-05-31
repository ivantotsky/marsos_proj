// lib/gtag.js
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// Log a pageview with the given URL
export function pageview(url) {
  window.gtag?.("config", GA_ID, {
    page_path: url,
  });
}
