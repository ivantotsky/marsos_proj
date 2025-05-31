import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET() {
  // this will bubble up into Vercel/Next.js' Edge runtime,
  // but Sentry will capture it before the 500 is returned.
  throw new SentryExampleAPIError(
    "This error is raised on the backend called by the example page."
  );

  // (unreachable but you could do:)
  // return NextResponse.json({ data: "Testing Sentry Error..." });
}
