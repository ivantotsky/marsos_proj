// app/page.js
import HomeContent from "./HomeContent";
import { cookies, headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  // 1. Read the i18next cookie (await cookies())
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("i18next")?.value;

  // 2. Read Accept-Language header (await headers())
  const headerStore = await headers();
  const headerLang = headerStore.get("accept-language") || "";

  // 3. Determine final language preference
  const finalLang = langCookie
    ? langCookie === "ar"
      ? "ar"
      : "en"
    : headerLang.startsWith("ar")
    ? "ar"
    : "en";

  const isArabic = finalLang === "ar";

  const seo = {
    en: {
      title:
        "Marsos | Marsos SA for Saudi industrial marketing and Digital transformation",
      description:
        "Marsos – Discover top Saudi industrial products on Marsos with premium quality and competitive prices from the kingdom of Saudi Arabia.",
      keywords:
        "marsos, industrial eCommerce, Saudi Arabia, industrial products",
      url: "https://marsos.sa/",
      ogImage: "https://marsos.sa/og-image-en.jpg",
      ogLocale: "en-US",
    },
    ar: {
      title: "مرصوص | منصة مرصوص لخدمات التسويق الصناعي و التحول الرقمي",
      description:
        "مرصوص – اكتشف أفضل المنتجات الصناعية من المصانع السعودية مباشرة بجودة عالية وأسعار منافسة لقطاع الاعمال.",
      keywords: "مرصوص, تجارة إلكترونية صناعية, السعودية, منتجات صناعية",
      url: "https://marsos.sa/",
      ogImage: "https://marsos.sa/og-image-ar.jpg",
      ogLocale: "ar-SA",
    },
  };

  const { title, description, keywords, url, ogImage, ogLocale } =
    seo[isArabic ? "ar" : "en"];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: {
        "en-US": url,
        "ar-SA": url,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Marsos",
      images: [{ url: ogImage }],
      locale: ogLocale,
      type: "website",
    },
  };
}

export default function HomePage() {
  return <HomeContent />;
}
