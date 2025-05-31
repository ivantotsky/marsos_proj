"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import ProductCard from "@/components/global/ProductCard";
import { useTranslation } from "react-i18next";

const CategoriesAndProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const handleResize = () =>
      setIsSmallScreen(
        typeof window !== "undefined" && window.innerWidth <= 768
      );
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productList);

        const uniqueCategories = [
          ...new Set(productList.map((p) => p.category?.trim())),
        ].map((category) => ({
          name: category,
          image:
            productList.find((p) => p.category?.trim() === category)
              ?.mainImageUrl || "https://via.placeholder.com/300",
        }));

        setCategories(uniqueCategories);

        // ✅ Select random category on load
        if (uniqueCategories.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * uniqueCategories.length
          );
          setActiveCategory(uniqueCategories[randomIndex].name?.trim());
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!activeCategory) {
      setSubcategories([]);
      setActiveSubcategory("");
    } else {
      const relatedProducts = products.filter(
        (p) =>
          p.category?.toLowerCase().trim() ===
          activeCategory.toLowerCase().trim()
      );

      const uniqueSubcategories = [
        ...new Set(
          relatedProducts.map((p) =>
            p.subCategory ? p.subCategory.trim() : "Other"
          )
        ),
      ];

      setSubcategories(uniqueSubcategories);
      setActiveSubcategory(
        uniqueSubcategories.length > 0 ? uniqueSubcategories[0] : "Other"
      );
    }
  }, [activeCategory, products]);

  const filteredProducts = products.filter((p) => {
    const categoryMatch =
      p.category?.toLowerCase().trim() === activeCategory.toLowerCase().trim();
    const subcategoryValue = (p.subCategory || "Other").toLowerCase().trim();
    const activeSubcategoryValue = (activeSubcategory || "Other")
      .toLowerCase()
      .trim();
    const subCategoryMatch =
      !activeSubcategory || subcategoryValue === activeSubcategoryValue;
    return categoryMatch && subCategoryMatch;
  });

  return (
    <div className='w-full px-4 md:px-8 py-6 mx-auto max-w-screen-xl'>
      <h2 className='text-xl font-semibold text-[#2c6449] mb-4 text-center'>
        {t("categories.categories")}
      </h2>

      <div className='relative w-full mb-8'>
        {/* Left Caret */}
        <button
          onClick={() =>
            document
              .getElementById("categoryScroll")
              .scrollBy({ left: -200, behavior: "smooth" })
          }
          className='absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 p-1 rounded-full shadow hover:bg-gray-100'
          aria-label='Scroll Left'
        >
          <svg
            className='w-5 h-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M15 19l-7-7 7-7'
            />
          </svg>
        </button>

        {/* Scrollable Category Row */}
        <div
          id='categoryScroll'
          className='flex gap-4 overflow-x-auto scrollbar-hide px-6 md:px-12'
        >
          {categories.map((category, index) => {
            const isActive =
              activeCategory?.toLowerCase().trim() ===
              category.name?.toLowerCase().trim();
            return (
              <div
                key={index}
                onClick={() => setActiveCategory(category.name?.trim())}
                className={`flex-none w-32 sm:w-36 rounded-lg overflow-hidden border transition shadow-sm hover:shadow-md cursor-pointer ${
                  isActive ? "ring-2 ring-[#2c6449]" : ""
                }`}
              >
                <div className='relative h-24 sm:h-28 w-full'>
                  <img
                    src={category.image}
                    alt={category.name}
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute bottom-0 w-full bg-black/60 text-white text-xs font-medium text-center py-1 truncate'>
                    {category.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Caret */}
        <button
          onClick={() =>
            document
              .getElementById("categoryScroll")
              .scrollBy({ left: 200, behavior: "smooth" })
          }
          className='absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 p-1 rounded-full shadow hover:bg-gray-100'
          aria-label='Scroll Right'
        >
          <svg
            className='w-5 h-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 5l7 7-7 7'
            />
          </svg>
        </button>
      </div>

      {/* Subcategories */}
      {activeCategory && subcategories.length > 0 && (
        <div className='my-6'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
            <h5 className='text-gray-600'>
              {t("categories.products", { count: filteredProducts.length })}
            </h5>

            {isSmallScreen ? (
              <select
                value={activeSubcategory}
                onChange={(e) => setActiveSubcategory(e.target.value)}
                className='border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-primary'
              >
                {subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            ) : (
              <div className='flex flex-wrap gap-2'>
                {subcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubcategory(sub)}
                    className={`px-4 py-2 text-sm font-medium rounded ${
                      activeSubcategory.toLowerCase().trim() ===
                      sub.toLowerCase().trim()
                        ? "bg-[#2c6449] text-white"
                        : "border border-[#2c6449] text-[#2c6449] hover:bg-[#2c6449] hover:text-white"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-6'>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => router.push(`/product/${product.id}`)}
              locale={
                typeof window !== "undefined" ? navigator.language : "en-US"
              }
              currencySymbol='SR'
            />
          ))
        ) : (
          <p className='text-center col-span-full text-sm text-gray-500'>
            {t("categories.no_products_found")}
          </p>
        )}
      </div>
    </div>
  );
};

export default CategoriesAndProductsPage;
