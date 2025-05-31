// app/[slug]/SlugContent.jsx
"use client";

import { useEffect } from "react";

export default function SlugContent({ slug }) {
  // Set <html lang> and <body dir> on the client
  useEffect(() => {
    document.documentElement.lang = slug === "مرصوص" ? "ar" : "en";
    document.body.dir = slug === "مرصوص" ? "rtl" : "ltr";
  }, [slug]);

  return (
    <main>
      <h1>
        {slug === "مرصوص"
          ? "مرصوص | منصة مرصوص لخدمات التسويق الصناعي و التحول الرقمي"
          : "Marsos | Marsos SA for Saudi industrial marketing and Digital transformation"}
      </h1>
      <p>
        {slug === "مرصوص"
          ? "مرصوص – اكتشف أفضل المنتجات الصناعية من المصانع السعودية مباشرة بجودة عالية وأسعار منافسة لقطاع الاعمال."
          : "Marsos – Discover top Saudi industrial products on Marsos with premium quality and competitive prices from the kingdom of Saudi Arabia."}
      </p>
      {/* …any other interactive UI… */}
    </main>
  );
}
