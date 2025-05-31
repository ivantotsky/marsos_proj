"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import ProductCard from "@/components/global/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

// Broadened slugify for full Arabic range
const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    // allow A–Z, 0–9, underscore, dash, space, and Arabic \u0600–\u06FF
    .replace(/[^\w\- \u0600-\u06FF]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

export default function CategoryPage() {
  const params = useParams();
  // decode percent-encoding into a proper Arabic string
  const rawSlug = params?.slug ? decodeURIComponent(params.slug) : "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const currencySymbol = locale === "ar" ? "ر.س." : "SR ";

  const formatNumber = (number) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(number);

  useEffect(() => {
    if (!rawSlug) return;

    const fetchProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const allProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // compare slugified category names to the decoded slug
        const matched = allProducts.filter((p) => {
          const categorySlug = p.category ? slugify(p.category) : "";
          return categorySlug === rawSlug;
        });

        if (matched.length > 0) {
          setCategoryName(matched[0].category);
        }

        setProducts(matched);
      } catch (err) {
        console.error("Failed to fetch category:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [rawSlug]);

  // fallback to turning hyphens back into spaces
  const readableCategory = categoryName || rawSlug.replace(/-/g, " ");

  return (
    <div className='container mx-auto px-4 py-6'>
      <h2 className='text-center text-2xl font-semibold text-[#2c6449] mb-6'>
        {readableCategory} {t("category.category")}
      </h2>

      {loading ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className='h-48 w-full rounded-md' />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              currencySymbol={currencySymbol}
              formatNumber={formatNumber}
            />
          ))}
        </div>
      ) : (
        <p className='text-center text-gray-500'>
          {t("category.noProductsFound")}
        </p>
      )}
    </div>
  );
}
