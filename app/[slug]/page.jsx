// app/[slug]/page.jsx

import SlugContent from "./SlugContent"; // Import your client component directly

export async function generateMetadata({ params }) {
  const slug = params.slug;
  if (slug === "مرصوص") {
    return {
      title: "مرصوص | منصة مرصوص لخدمات التسويق الصناعي و التحول الرقمي",
      description:
        "مرصوص – اكتشف أفضل المنتجات الصناعية من المصانع السعودية مباشرة بجودة عالية وأسعار منافسة لقطاع الاعمال.",
      alternates: {
        canonical: "https://marsos.sa/مرصوص",
        languages: {
          "ar-SA": "https://marsos.sa/مرصوص",
          "en-SA": "https://marsos.sa/marsos",
        },
      },
    };
  } else if (slug === "marsos") {
    return {
      title:
        "Marsos | Marsos SA for Saudi industrial marketing and Digital transformation",
      description:
        "Marsos – Discover top Saudi industrial products on Marsos with premium quality and competitive prices from the kingdom of Saudi Arabia.",
      alternates: {
        canonical: "https://marsos.sa/marsos",
        languages: {
          "ar-SA": "https://marsos.sa/مرصوص",
          "en-SA": "https://marsos.sa/marsos",
        },
      },
    };
  }

  return {
    title: "404 – Marsos",
    description: "الصفحة غير موجودة",
  };
}

export default function SlugPage({ params }) {
  const { slug } = params;

  if (slug !== "مرصوص" && slug !== "marsos") {
    // You can also throw notFound() here if you prefer
    return <h1>404 – Page Not Found</h1>;
  }

  return <SlugContent slug={slug} />;
}
