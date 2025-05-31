// next.config.mjs
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // no more experimental.nodeMiddleware here
  reactStrictMode: true,
  // …any other flags you need
};

export default withSentryConfig(nextConfig, {
  org: "marsos",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
