// app/layout.js
import { Montserrat, Cairo } from "next/font/google";
import "./globals.css";
import RootProvider from "./RootProvider";
import Script from "next/script";
import React, { Suspense } from "react";
import AnalyticsWrapper from "@/components/AnalyticsListener/AnalyticsWrapper";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang='en'>
      <head>
        {GA_ID && (
          <>
            {/* 1) Load GA4 library */}
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy='afterInteractive'
            />
            {/* 2) Initialize gtag */}
            <Script id='gtag-init' strategy='afterInteractive'>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${montserrat.variable} ${cairo.variable} antialiased`}>
        {/* 
          Wrap your client-only analytics listener in Suspense 
          so SSR/prerender doesn’t choke on useSearchParams()
        */}
        <Suspense fallback={null}>
          <AnalyticsWrapper />
        </Suspense>

        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
