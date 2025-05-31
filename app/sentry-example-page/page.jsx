"use client";

import { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

class SentryExampleFrontendError extends Error {
  // drop the TS type annotation here
  constructor(message) {
    super(message);
    this.name = "SentryExampleFrontendError";
  }
}

export default function SentryExamplePage() {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (triggered) {
      try {
        // throw a custom error to test Sentry
        throw new SentryExampleFrontendError("This is a frontend test error");
      } catch (err) {
        Sentry.captureException(err);
      }
    }
  }, [triggered]);

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Sentry Example Page</h1>
      <button
        onClick={() => setTriggered(true)}
        className='px-4 py-2 bg-green-600 text-white rounded'
      >
        Trigger Frontend Error
      </button>
    </div>
  );
}
