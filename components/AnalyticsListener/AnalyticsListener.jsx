// components/AnalyticsListener.jsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { pageview } from "@/lib/gtag";

export default function AnalyticsListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url =
      pathname + (searchParams.toString() ? "?" + searchParams.toString() : "");
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}
