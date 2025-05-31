"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useTranslation } from "react-i18next";
import ProductCard from "../global/ProductCard";

const TrendingProductsSection = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("trending");
  const [error, setError] = useState(null);

  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-SA" : "en-US";
  const currencySymbol = "SR";

  const formatNumber = useCallback(
    (number) =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(number),
    [locale]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAllProducts(fetched);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(t("errors.failedToLoadProducts"));
      }
    };

    fetchData();
  }, [t]);

  const getTrendingProducts = useCallback(() => {
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  }, [allProducts]);

  return (
    <section className='bg-gray-50 py-10'>
      <div className='w-[90%] mx-auto'>
        {/* Tabs */}
        <div className='flex flex-wrap gap-3 mb-8'>
          <button
            onClick={() => setActiveTab("trending")}
            className={`px-5 py-2 text-sm rounded-md font-semibold transition ${
              activeTab === "trending"
                ? "bg-[#2c6449] text-white"
                : "bg-white border border-gray-300 text-[#2c6449]"
            }`}
          >
            {t("section.trending")}
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2 text-sm rounded-md font-semibold transition ${
              activeTab === "all"
                ? "bg-[#2c6449] text-white"
                : "bg-white border border-gray-300 text-[#2c6449]"
            }`}
          >
            {t("section.allProducts")}
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className='text-center text-red-600'>{error}</div>
        ) : (
          <div
            className='
              grid
              grid-cols-2       /* 2 columns on the smallest screens */
              sm:grid-cols-2    /* still 2 from 640px up */
              md:grid-cols-3    /* 3 from 768px up */
              lg:grid-cols-4    /* 4 from 1024px up */
              gap-6
            '
          >
            {(activeTab === "trending"
              ? getTrendingProducts()
              : allProducts
            ).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                currencySymbol={currencySymbol}
                formatNumber={formatNumber}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingProductsSection;
