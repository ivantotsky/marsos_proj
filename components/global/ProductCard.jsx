"use client";

import React, { memo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Eye, Mail, Heart } from "react-feather";
import { getAuth } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import Currency from "@/components/global/CurrencySymbol";
import { toast } from "sonner";
import { db } from "@/firebase/config";

const ProductCard = ({ product, locale, currencySymbol, formatNumber }) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [isPending, startTransition] = useTransition();

  // Pricing logic
  const priceRanges = product.priceRanges || [];
  const prices = priceRanges.map((r) => parseFloat(r.price));
  const lowestPrice = prices.length ? Math.min(...prices) : NaN;
  const highestPrice = prices.length ? Math.max(...prices) : NaN;
  const minOrder = priceRanges[0]?.minQty || "N/A";
  const mainImage = product.mainImageUrl || "https://via.placeholder.com/300";
  const category = product.category || t("uncategorized");

  const getLocalizedProductName = () => {
    const name = product.productName;
    if (typeof name === "string") return name;
    if (name && typeof name === "object") {
      return (
        name[i18n.language] || name.en || t("product_card.unnamed_product")
      );
    }
    return t("product_card.unnamed_product");
  };

  const handleViewProduct = () => {
    startTransition(() => {
      router.push(`/product/${product.id}`);
    });
  };

  const handleContactSupplier = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error(t("product_card.login_first"));
      return;
    }
    if (currentUser.uid === product.supplierId) {
      toast.error(t("product_card.cannot_chat_own"));
      return;
    }

    const chatId = `${currentUser.uid}_${product.supplierId}_${product.id}`;
    const chatRef = doc(db, "productChats", chatId);
    const miniRef = doc(db, "miniProductsData", chatId);

    try {
      const existing = await getDoc(chatRef);
      if (!existing.exists()) {
        await setDoc(chatRef, {
          buyerId: currentUser.uid,
          supplierId: product.supplierId,
          productId: product.id,
          participants: [currentUser.uid, product.supplierId],
          createdAt: serverTimestamp(),
        });
      }

      const payload = {
        id: product.id,
        productName: product.productName,
        description: product.description,
        category: product.category,
        subCategory: product.subCategory,
        mainLocation: product.mainLocation,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        supplierNumber: product.supplierNumber,
        mainImageUrl: product.mainImageUrl,
        additionalImageUrls: product.additionalImageUrls,
        colors: product.colors,
        sizes: product.sizes,
        priceRanges: product.priceRanges,
        createdAt: product.createdAt || serverTimestamp(),
        snapshotAt: serverTimestamp(),
        lastEditedAt: serverTimestamp(),
        ...(product.slug !== undefined && { slug: product.slug }),
      };

      await setDoc(miniRef, payload, { merge: true });
      router.push(`/chat/product/${chatId}`);
    } catch (err) {
      console.error("Error initializing chat or snapshot:", err);
      toast.error(t("product_card.chat_create_failed"));
    }
  };

  useEffect(() => {
    router.prefetch(`/product/${product.id}`);
  }, [product.id, router]);

  return (
    <div className='p-1 sm:p-2 relative'>
      {isPending && (
        <div className='absolute inset-0 bg-white/70 flex items-center justify-center z-50'>
          <span className='text-[#2c6449] text-[0.6rem] sm:text-sm font-medium'>
            {t("product_card.loading")}...
          </span>
        </div>
      )}

      <div className='relative group bg-white border rounded-xl shadow hover:shadow-md transition-all flex flex-col overflow-hidden'>
        <div className='absolute top-2 right-2 z-10'>
          <Heart size={16} className='text-red-500' />
        </div>
        <div className='absolute top-2 left-2 bg-red-600 text-white text-[0.5rem] sm:text-xs font-semibold px-2 py-0.5 rounded shadow z-10'>
          {t("product_card.hot")}
        </div>
        <div
          className='relative aspect-[4/3] bg-white overflow-hidden border-b border-gray-200 cursor-pointer'
          onClick={handleViewProduct}
        >
          <img
            src={mainImage}
            alt={getLocalizedProductName()}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out'
            loading='lazy'
          />
        </div>

        <div className='flex flex-col p-2 sm:p-4 flex-1 bg-white'>
          <div className='flex-1'>
            {/* Category */}
            <p className='text-[0.6rem] sm:text-xs text-gray-400 mb-1 capitalize'>
              {category}
            </p>

            {/* Product Name */}
            <h3
              onClick={handleViewProduct}
              className='
                text-xs sm:text-sm md:text-base
                font-semibold text-gray-800
                leading-snug hover:text-[#2c6449]
                cursor-pointer line-clamp-2 capitalize
              '
            >
              {getLocalizedProductName()}
            </h3>

            {/* Supplier */}
            <p className='text-[0.6rem] sm:text-xs text-gray-500 mt-1 mb-2'>
              {t("product_card.supplier")}{" "}
              <span className='capitalize font-medium'>
                {product.supplierName || t("product_card.unknown")}
              </span>
            </p>

            {/* Price */}
            {!isNaN(lowestPrice) && !isNaN(highestPrice) && lowestPrice > 0 ? (
              <p
                className='
      text-sm        /* smaller base font */
      sm:text-lg     /* back to normal on sm+ */
      font-bold
      mb-1
      whitespace-nowrap  /* force one line */
      capitalize
    '
              >
                <Currency amount={lowestPrice} />–
                <Currency amount={highestPrice} />
              </p>
            ) : (
              <p className='text-[0.75rem] sm:text-xs italic text-[#2c6449] mb-1'>
                {t("product_card.negotiable")}
              </p>
            )}

            {/* Min order */}
            <p className='text-[0.6rem] sm:text-xs text-gray-500 capitalize'>
              {t("product_card.min_order", { minOrder })}
            </p>
          </div>

          {/* Buttons */}
          <div className='flex flex-col sm:flex-row gap-1 sm:gap-2 mt-4'>
            <button
              onClick={handleViewProduct}
              className='
                w-full sm:w-1/2
                text-[0.6rem] sm:text-xs
                py-1.5 px-2
                border border-[#2c6449] text-[#2c6449]
                font-medium rounded-md hover:bg-[#2c644910]
                transition capitalize flex items-center justify-center gap-1
              '
            >
              <Eye size={14} />
              {t("product_card.view_details")}
            </button>

            <button
              onClick={handleContactSupplier}
              className='
                w-full sm:w-1/2
                text-[0.6rem] sm:text-xs
                py-1.5 px-2
                border border-blue-600 text-blue-600
                font-medium rounded-md hover:bg-blue-50
                transition capitalize flex items-center justify-center gap-1
              '
            >
              <Mail size={14} />
              {t("product_card.contact_supplier")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductCard);
