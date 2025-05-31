"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
} from "../ui/command";

import { db } from "../../firebase/config";
import { getDocs, collection } from "firebase/firestore";

import { Search } from "react-feather";

const ProductSearch = () => {
  const [productQuery, setProductQuery] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const router = useRouter();

  const normalize = (str) => {
    if (typeof str !== "string") return "";
    return str.toLowerCase().normalize("NFKD");
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        const name =
          data.productName ||
          data.productName_en ||
          data.productName_ar ||
          "Unnamed Product";
        const thumbnail = data.mainImageUrl || "/placeholder-product.png";

        return {
          id: doc.id,
          name: typeof name === "string" ? name : String(name),
          thumbnail,
        };
      });

      setProductOptions(items);
      setFilteredProducts(items);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!productQuery) {
      setFilteredProducts(productOptions);
    } else {
      setFilteredProducts(
        productOptions.filter((item) =>
          normalize(item.name).includes(normalize(productQuery))
        )
      );
    }
  }, [productQuery, productOptions]);

  const handleSelect = (selectedValue) => {
    const selectedProduct = productOptions.find(
      (item) => item.name.toLowerCase() === selectedValue.toLowerCase()
    );
    if (selectedProduct?.id) {
      router.push(`/product/${selectedProduct.id}`);
    }
  };

  const handleSearch = () => {
    if (productQuery.trim()) {
      const selectedProduct = productOptions.find((item) =>
        normalize(item.name).includes(normalize(productQuery.trim()))
      );
      if (selectedProduct?.id) {
        router.push(`/product/${selectedProduct.id}`);
      } else {
        router.push(`/search?query=${encodeURIComponent(productQuery.trim())}`);
      }
    }
  };

  return (
    <div dir={i18n.dir()} className='relative w-full'>
      {/* Search bar container */}
      <div
        className={`flex items-center w-full border rounded-full overflow-hidden shadow-sm
                    h-12 sm:h-10 bg-white`}
      >
        {/* Category label */}
        <div
          className={`px-2 sm:px-3 text-gray-600 text-xs sm:text-sm flex-shrink-0
                      flex items-center gap-1 h-full 
                      ${isRtl ? "border-l" : "border-r"}`}
        >
          {t("sticky.products")}
        </div>

        {/* Input */}
        <input
          dir={i18n.dir()}
          type='text'
          placeholder={t("sticky.search_placeholder")}
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
          className={`flex-1 px-2 sm:px-4 text-xs sm:text-sm h-full focus:outline-none
                      ${isRtl ? "text-right" : "text-left"}`}
        />

        {/* Search button */}
        <button
          onClick={handleSearch}
          className={`bg-primary hover:bg-green-700 text-white text-xs sm:text-sm
                      px-3 sm:px-4 flex items-center gap-1 h-full 
                      ${isRtl ? "rounded-l-full" : "rounded-r-full"}`}
        >
          <Search size={16} />
        </button>
      </div>

      {/* Dropdown results */}
      {productQuery && (
        <div className='absolute inset-x-0 mt-1 z-50'>
          <Command className='w-full bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden'>
            <CommandInput
              value={productQuery}
              onValueChange={setProductQuery}
              placeholder={t("sticky.search_placeholder")}
              className='hidden'
            />
            <CommandList className='max-h-64 sm:max-h-[400px] overflow-y-auto'>
              {filteredProducts.length > 0 ? (
                <CommandGroup heading={t("search.productsHeading")}>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={handleSelect}
                      className={`flex items-center ${
                        isRtl ? "flex-row-reverse" : "flex-row"
                      } gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-[#2c6449]/10 transition`}
                    >
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className='w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0'
                      />
                      <span className='text-xs sm:text-base text-gray-700 truncate'>
                        {product.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <div className='flex flex-col items-center justify-center p-4 sm:p-6 gap-1 sm:gap-2 text-center'>
                  <img
                    src='/no-results-search.svg'
                    alt='No results'
                    className='w-16 h-16 sm:w-24 sm:h-24 object-contain'
                  />
                  <p className='text-gray-500 text-xs sm:text-sm'>
                    {t("search.noResults")}
                  </p>
                </div>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
