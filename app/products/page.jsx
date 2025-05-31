"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import ProductCard from "@/components/global/ProductCard";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Newest");
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const locale = typeof window !== "undefined" ? navigator.language : "en-US";
  const currencySymbol = "SR";

  const formatNumber = (number, locale) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(number);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 768);
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
        setFilteredProducts(productList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let sorted = [...products];
    switch (activeTab) {
      case "Lowest":
        sorted.sort(
          (a, b) =>
            (a.priceRanges?.[0]?.price || 0) - (b.priceRanges?.[0]?.price || 0)
        );
        break;
      case "Highest":
        sorted.sort(
          (a, b) =>
            (b.priceRanges?.[0]?.price || 0) - (a.priceRanges?.[0]?.price || 0)
        );
        break;
      case "Newest":
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "Oldest":
        sorted.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "Locations":
        sorted.sort((a, b) =>
          (a.mainLocation || "").localeCompare(b.mainLocation || "")
        );
        break;
      default:
        break;
    }
    setFilteredProducts(sorted);
  }, [activeTab, products]);

  if (loading) {
    return <p className='text-center py-8 text-sm'>Loading products...</p>;
  }

  if (products.length === 0) {
    return <p className='text-center py-8 text-sm'>No products available.</p>;
  }

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6'>
        <h2 className='text-lg font-semibold text-[#2c6449]'>
          Total {filteredProducts.length} Products
        </h2>

        {/* Sort Tabs */}
        {isSmallScreen ? (
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className='border border-gray-300 text-sm px-3 py-2 rounded'
          >
            {["Newest", "Oldest", "Lowest", "Highest", "Locations"].map(
              (tab) => (
                <option key={tab} value={tab}>
                  {tab}
                </option>
              )
            )}
          </select>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {["Newest", "Oldest", "Lowest", "Highest", "Locations"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border rounded ${
                    activeTab === tab
                      ? "bg-[#2c6449] text-white"
                      : "border-gray-300 text-gray-600 hover:bg-[#2c6449] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'>
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            locale={locale}
            currencySymbol={currencySymbol}
            formatNumber={formatNumber}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;
